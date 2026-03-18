package app.navilla.exception;

/**
 * Thrown when a user has reached the maximum allowed count for a resource type.
 * Returns HTTP 409 with a specific message distinguishable from other conflicts.
 */
public class ResourceCapExceededException extends RuntimeException {

  private final String messageKey;
  private final String resourceType;
  private final int cap;

  /**
   * Creates a resource cap exceeded exception.
   *
   * @param messageKey i18n message key
   * @param resourceType the type of resource (e.g., "journalEntries")
   * @param cap the maximum allowed count
   */
  public ResourceCapExceededException(String messageKey, String resourceType, int cap) {
    super(messageKey);
    this.messageKey = messageKey;
    this.resourceType = resourceType;
    this.cap = cap;
  }

  /**
   * Returns the message key for localization.
   *
   * @return message key
   */
  public String getMessageKey() {
    return messageKey;
  }

  /**
   * Returns the resource type.
   *
   * @return resource type
   */
  public String getResourceType() {
    return resourceType;
  }

  /**
   * Returns the cap value.
   *
   * @return maximum allowed count
   */
  public int getCap() {
    return cap;
  }
}
