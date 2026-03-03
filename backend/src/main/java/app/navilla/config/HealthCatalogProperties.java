package app.navilla.config;

import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the health catalog: medication types,
 * dosing frequencies, vaccine series, testing heuristics, and follow-up rules.
 *
 * <p>Values are loaded from {@code navilla.health-catalog} in application.yaml
 * and drive the reminder calculation engine and catalog API.
 */
@ConfigurationProperties(prefix = "navilla.health-catalog")
public record HealthCatalogProperties(
    Map<String, MedicationTypeConfig> medicationTypes,
    Map<String, FrequencyConfig> frequencies,
    Map<String, VaccineSeriesConfig> vaccineSeries,
    TestingHeuristicsConfig testingHeuristics,
    FollowUpRulesConfig followUpRules
) {

  /** Configuration for a single medication type. */
  public record MedicationTypeConfig(String labelKey, String defaultFrequency, boolean ongoing) {}

  /** Configuration for a dosing frequency. */
  public record FrequencyConfig(Integer hours, Integer days) {}

  /** Configuration for a vaccine series (doses and intervals). */
  public record VaccineSeriesConfig(String labelKey, int totalDoses, List<Integer> doseIntervalsDays) {}

  /** Heuristic thresholds for auto-generating testing reminders. */
  public record TestingHeuristicsConfig(
      int highActivityIntervalDays,
      int moderateActivityIntervalDays,
      int highActivityThreshold,
      int nudgeAfterDays
  ) {}

  /** Rules for follow-up reminders after positive results. */
  public record FollowUpRulesConfig(int testOfCureDays, int windowPeriodDefaultDays) {}
}
