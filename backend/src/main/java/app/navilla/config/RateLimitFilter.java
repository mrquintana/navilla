package app.navilla.config;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

import app.navilla.dto.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rate limiting filter using Bucket4j token bucket algorithm.
 *
 * <p>Three tiers: write (POST/PUT/PATCH/DELETE), read (GET), and sensitive
 * (connection/phone-match endpoints). Falls back to IP-based limiting for
 * unauthenticated requests.
 */
public class RateLimitFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
  private static final ObjectMapper MAPPER = new ObjectMapper()
      .registerModule(new JavaTimeModule());

  private static final Set<String> SENSITIVE_PATHS = Set.of(
      "/api/connections",
      "/api/connections/phone-match",
      "/api/connections/respond",
      "/api/push/subscribe"
  );

  private static final Set<String> WRITE_METHODS = Set.of(
      "POST", "PUT", "PATCH", "DELETE"
  );

  private final RateLimitProperties properties;
  private final Cache<String, Bucket> writeBuckets = buildCache();
  private final Cache<String, Bucket> readBuckets = buildCache();
  private final Cache<String, Bucket> sensitiveBuckets = buildCache();
  private final Cache<String, Bucket> ipBuckets = buildCache();

  private static Cache<String, Bucket> buildCache() {
    return Caffeine.newBuilder()
        .expireAfterAccess(Duration.ofMinutes(5))
        .maximumSize(10_000)
        .build();
  }

  /**
   * Creates a rate limit filter with the given properties.
   *
   * @param properties rate limit configuration
   */
  public RateLimitFilter(RateLimitProperties properties) {
    this.properties = properties;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();

    // Skip when disabled or non-API requests
    if (!properties.enabled() || !path.startsWith("/api/")) {
      filterChain.doFilter(request, response);
      return;
    }

    String method = request.getMethod();
    String userKey = extractUserKey(request);
    boolean authenticated = !userKey.startsWith("ip:");

    // Determine which bucket to check
    Bucket bucket;
    if (authenticated && isSensitivePath(path) && WRITE_METHODS.contains(method)) {
      bucket = sensitiveBuckets.get(
          userKey + ":sensitive", k -> createBucket(properties.sensitivePerMinute()));
    } else if (authenticated && WRITE_METHODS.contains(method)) {
      bucket = writeBuckets.get(
          userKey + ":write", k -> createBucket(properties.writePerMinute()));
    } else if (authenticated) {
      bucket = readBuckets.get(
          userKey + ":read", k -> createBucket(properties.readPerMinute()));
    } else {
      bucket = ipBuckets.get(
          userKey, k -> createBucket(properties.globalPerMinutePerIp()));
    }

    ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
    if (!probe.isConsumed()) {
      long retryAfterSeconds = Duration.ofNanos(probe.getNanosToWaitForRefill())
          .toSeconds() + 1;

      log.warn("Rate limit exceeded: user={} path={} method={} retryAfter={}s",
          userKey, path, method, retryAfterSeconds);

      response.setStatus(429);
      response.setContentType("application/json");
      response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

      ApiError body = ApiError.of(429, "Too Many Requests",
          "Rate limit exceeded. Please try again later.", path);
      MAPPER.writeValue(response.getWriter(), body);
      return;
    }

    filterChain.doFilter(request, response);
  }

  private String extractUserKey(HttpServletRequest request) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof Jwt jwt) {
      return "user:" + jwt.getSubject();
    }
    return "ip:" + getClientIp(request);
  }

  private String getClientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  private boolean isSensitivePath(String path) {
    for (String sensitive : SENSITIVE_PATHS) {
      if (path.equals(sensitive) || path.startsWith(sensitive + "/")) {
        return true;
      }
    }
    return false;
  }

  private Bucket createBucket(int tokensPerMinute) {
    return Bucket.builder()
        .addLimit(limit -> limit.capacity(tokensPerMinute)
            .refillGreedy(tokensPerMinute, Duration.ofMinutes(1)))
        .build();
  }
}
