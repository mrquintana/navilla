package app.navilla.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for per-user resource caps.
 *
 * @param journalEntries max journal entries per user
 * @param partners max partners per user
 * @param testVisits max test visits per user
 * @param labs max lab profiles per user
 * @param connections max connections per user
 * @param customFieldTemplates max custom field templates per user
 * @param verificationCards max verification cards per user
 * @param reminders max reminders per user
 * @param medications max medications per user
 */
@ConfigurationProperties(prefix = "navilla.resource-caps")
public record ResourceCapProperties(
    int journalEntries,
    int partners,
    int testVisits,
    int labs,
    int connections,
    int customFieldTemplates,
    int verificationCards,
    int reminders,
    int medications
) {

  /**
   * Compact constructor that applies defaults for non-positive values.
   */
  public ResourceCapProperties {
    if (journalEntries <= 0) {
      journalEntries = 10000;
    }
    if (partners <= 0) {
      partners = 500;
    }
    if (testVisits <= 0) {
      testVisits = 5000;
    }
    if (labs <= 0) {
      labs = 50;
    }
    if (connections <= 0) {
      connections = 500;
    }
    if (customFieldTemplates <= 0) {
      customFieldTemplates = 10;
    }
    if (verificationCards <= 0) {
      verificationCards = 20;
    }
    if (reminders <= 0) {
      reminders = 50;
    }
    if (medications <= 0) {
      medications = 50;
    }
  }
}
