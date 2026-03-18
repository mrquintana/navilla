package app.navilla.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for API rate limiting.
 *
 * @param enabled whether rate limiting is active
 * @param writePerMinute max write requests per user per minute
 * @param readPerMinute max read requests per user per minute
 * @param sensitivePerMinute max sensitive endpoint requests per user per minute
 * @param globalPerMinutePerIp max requests per IP per minute (unauthenticated)
 */
@ConfigurationProperties(prefix = "navilla.rate-limit")
public record RateLimitProperties(
    boolean enabled,
    int writePerMinute,
    int readPerMinute,
    int sensitivePerMinute,
    int globalPerMinutePerIp
) {

  /**
   * Compact constructor that applies defaults for non-positive values.
   */
  public RateLimitProperties {
    if (writePerMinute <= 0) {
      writePerMinute = 30;
    }
    if (readPerMinute <= 0) {
      readPerMinute = 120;
    }
    if (sensitivePerMinute <= 0) {
      sensitivePerMinute = 10;
    }
    if (globalPerMinutePerIp <= 0) {
      globalPerMinutePerIp = 300;
    }
  }
}
