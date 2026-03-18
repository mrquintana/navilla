package app.navilla.service;

import java.util.Map;

import app.navilla.config.ResourceCapProperties;
import app.navilla.exception.ResourceCapExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Enforces per-user resource creation limits.
 *
 * <p>Each service should call {@link #checkCap} before creating a new resource.
 * Caps are configurable via {@code navilla.resource-caps.*} in application.yaml.
 */
@Service
public class ResourceCapService {

  private static final Logger log = LoggerFactory.getLogger(ResourceCapService.class);

  private final Map<String, Integer> caps;

  /**
   * Creates a resource cap service with the given properties.
   *
   * @param props resource cap configuration
   */
  public ResourceCapService(ResourceCapProperties props) {
    this.caps = Map.of(
        "journalEntries", props.journalEntries(),
        "partners", props.partners(),
        "testVisits", props.testVisits(),
        "labs", props.labs(),
        "connections", props.connections(),
        "customFieldTemplates", props.customFieldTemplates(),
        "verificationCards", props.verificationCards(),
        "reminders", props.reminders(),
        "medications", props.medications()
    );
  }

  /**
   * Checks if the user has reached the cap for the given resource type.
   *
   * @param resourceType the resource type key (e.g., "journalEntries")
   * @param currentCount the user's current count of this resource
   * @throws ResourceCapExceededException if currentCount >= cap
   * @throws IllegalArgumentException if resourceType is unknown
   */
  public void checkCap(String resourceType, long currentCount) {
    Integer cap = caps.get(resourceType);
    if (cap == null) {
      throw new IllegalArgumentException("Unknown resource type: " + resourceType);
    }
    if (currentCount >= cap) {
      log.warn("Resource cap reached: type={} count={} cap={}", resourceType, currentCount, cap);
      throw new ResourceCapExceededException(
          "errors.resourceCapExceeded", resourceType, cap);
    }
  }
}
