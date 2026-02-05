package app.navilla.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for CORS allowed origins and patterns.
 */
@Component
@ConfigurationProperties(prefix = "navilla.cors")
public class CorsProperties {

  private final List<String> allowedOrigins = new ArrayList<>();
  private final List<String> allowedOriginPatterns = new ArrayList<>();

  /**
   * Returns the explicit allowed origins list.
   *
   * @return list of allowed origins
   */
  public List<String> getAllowedOrigins() {
    return allowedOrigins;
  }

  /**
   * Returns the allowed origin patterns list.
   *
   * @return list of allowed origin patterns
   */
  public List<String> getAllowedOriginPatterns() {
    return allowedOriginPatterns;
  }
}
