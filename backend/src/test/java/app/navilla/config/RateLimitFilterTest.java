package app.navilla.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Unit tests for {@link RateLimitFilter}.
 */
class RateLimitFilterTest {

  private RateLimitFilter filter;
  private RateLimitProperties properties;

  @BeforeEach
  void setUp() {
    properties = new RateLimitProperties(true, 30, 120, 10, 300);
    filter = new RateLimitFilter(properties);
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("allows requests within write rate limit")
  void allowsRequestsWithinWriteLimit() throws Exception {
    setAuthenticatedUser("user-1");
    MockHttpServletRequest request = postRequest("/api/journal");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilterInternal(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(chain.getRequest()).isNotNull();
  }

  @Test
  @DisplayName("blocks requests exceeding write rate limit with 429")
  void blocksExceedingWriteLimit() throws Exception {
    setAuthenticatedUser("user-2");
    RateLimitProperties strictProps = new RateLimitProperties(true, 2, 120, 10, 300);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // Exhaust write limit
    for (int i = 0; i < 2; i++) {
      MockHttpServletResponse resp = new MockHttpServletResponse();
      strictFilter.doFilterInternal(postRequest("/api/journal"), resp, new MockFilterChain());
      assertThat(resp.getStatus()).isEqualTo(200);
    }

    // Third request should be blocked
    MockHttpServletResponse blocked = new MockHttpServletResponse();
    strictFilter.doFilterInternal(postRequest("/api/journal"), blocked, new MockFilterChain());

    assertThat(blocked.getStatus()).isEqualTo(429);
    assertThat(blocked.getHeader("Retry-After")).isNotNull();
    assertThat(blocked.getContentAsString()).contains("Too Many Requests");
  }

  @Test
  @DisplayName("uses IP-based limiting for unauthenticated requests")
  void usesIpLimitingForUnauthenticated() throws Exception {
    RateLimitProperties strictProps = new RateLimitProperties(true, 30, 120, 10, 2);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // Exhaust IP limit
    for (int i = 0; i < 2; i++) {
      MockHttpServletResponse resp = new MockHttpServletResponse();
      MockHttpServletRequest req = getRequest("/api/catalog");
      req.setRemoteAddr("10.0.0.1");
      strictFilter.doFilterInternal(req, resp, new MockFilterChain());
    }

    // Third request blocked
    MockHttpServletResponse blocked = new MockHttpServletResponse();
    MockHttpServletRequest req = getRequest("/api/catalog");
    req.setRemoteAddr("10.0.0.1");
    strictFilter.doFilterInternal(req, blocked, new MockFilterChain());

    assertThat(blocked.getStatus()).isEqualTo(429);
  }

  @Test
  @DisplayName("applies sensitive tier to connection endpoints")
  void appliesSensitiveTierToConnections() throws Exception {
    setAuthenticatedUser("user-3");
    RateLimitProperties strictProps = new RateLimitProperties(true, 30, 120, 2, 300);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // Exhaust sensitive limit
    for (int i = 0; i < 2; i++) {
      MockHttpServletResponse resp = new MockHttpServletResponse();
      strictFilter.doFilterInternal(
          postRequest("/api/connections"), resp, new MockFilterChain());
    }

    // Third request blocked
    MockHttpServletResponse blocked = new MockHttpServletResponse();
    strictFilter.doFilterInternal(
        postRequest("/api/connections"), blocked, new MockFilterChain());

    assertThat(blocked.getStatus()).isEqualTo(429);
  }

  @Test
  @DisplayName("allows read requests within read rate limit")
  void allowsReadRequestsWithinLimit() throws Exception {
    setAuthenticatedUser("user-4");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilterInternal(getRequest("/api/journal"), response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(200);
  }

  @Test
  @DisplayName("skips non-API requests")
  void skipsNonApiRequests() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilterInternal(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(chain.getRequest()).isNotNull();
  }

  @Test
  @DisplayName("different users have independent rate limit buckets")
  void differentUsersHaveIndependentBuckets() throws Exception {
    RateLimitProperties strictProps = new RateLimitProperties(true, 1, 120, 10, 300);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // User A exhausts their write limit
    setAuthenticatedUser("user-a");
    MockHttpServletResponse respA = new MockHttpServletResponse();
    strictFilter.doFilterInternal(postRequest("/api/journal"), respA, new MockFilterChain());
    assertThat(respA.getStatus()).isEqualTo(200);

    // User B should still be able to write
    setAuthenticatedUser("user-b");
    MockHttpServletResponse respB = new MockHttpServletResponse();
    strictFilter.doFilterInternal(postRequest("/api/journal"), respB, new MockFilterChain());
    assertThat(respB.getStatus()).isEqualTo(200);
  }

  // --- helpers ---

  private void setAuthenticatedUser(String subject) {
    Jwt jwt = Jwt.withTokenValue("test")
        .header("alg", "RS256")
        .subject(subject)
        .claim("email", subject + "@test.com")
        .build();
    SecurityContextHolder.getContext()
        .setAuthentication(new JwtAuthenticationToken(jwt,
            List.of(new SimpleGrantedAuthority("ROLE_USER"))));
  }

  private MockHttpServletRequest postRequest(String uri) {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
    request.setRemoteAddr("127.0.0.1");
    return request;
  }

  private MockHttpServletRequest getRequest(String uri) {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
    request.setRemoteAddr("127.0.0.1");
    return request;
  }
}
