package app.navilla.entity;

public enum TestResultStatus {
  POSITIVE,
  NEGATIVE,
  PENDING,
  INDETERMINATE;

  public static TestResultStatus fromValue(String value) {
    return TestResultStatus.valueOf(value.toUpperCase());
  }
}
