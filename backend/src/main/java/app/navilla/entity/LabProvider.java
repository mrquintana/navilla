package app.navilla.entity;

public enum LabProvider {
  CHOPO,
  SALUD_DIGNA,
  OTHER;

  public static LabProvider fromValue(String value) {
    return LabProvider.valueOf(value.toUpperCase());
  }
}
