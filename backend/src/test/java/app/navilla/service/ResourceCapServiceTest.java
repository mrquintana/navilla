package app.navilla.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.navilla.config.ResourceCapProperties;
import app.navilla.exception.ResourceCapExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link ResourceCapService}.
 */
class ResourceCapServiceTest {

  private ResourceCapService service;

  @BeforeEach
  void setUp() {
    ResourceCapProperties props = new ResourceCapProperties(
        100, 50, 200, 10, 50, 5, 10, 20, 20);
    service = new ResourceCapService(props);
  }

  @Test
  @DisplayName("allows creation when below cap")
  void allowsCreationBelowCap() {
    assertThatCode(() -> service.checkCap("journalEntries", 99))
        .doesNotThrowAnyException();
  }

  @Test
  @DisplayName("throws when at cap")
  void throwsWhenAtCap() {
    assertThatThrownBy(() -> service.checkCap("journalEntries", 100))
        .isInstanceOf(ResourceCapExceededException.class);
  }

  @Test
  @DisplayName("throws when over cap")
  void throwsWhenOverCap() {
    assertThatThrownBy(() -> service.checkCap("journalEntries", 150))
        .isInstanceOf(ResourceCapExceededException.class);
  }

  @Test
  @DisplayName("checks each resource type independently")
  void checksEachResourceType() {
    assertThatCode(() -> service.checkCap("partners", 49)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("partners", 50))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("testVisits", 199)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("testVisits", 200))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("labs", 9)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("labs", 10))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("connections", 49)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("connections", 50))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("customFieldTemplates", 4)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("customFieldTemplates", 5))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("verificationCards", 9)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("verificationCards", 10))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("reminders", 19)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("reminders", 20))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("medications", 19)).doesNotThrowAnyException();
    assertThatThrownBy(() -> service.checkCap("medications", 20))
        .isInstanceOf(ResourceCapExceededException.class);
  }

  @Test
  @DisplayName("throws IllegalArgumentException for unknown resource type")
  void throwsForUnknownResourceType() {
    assertThatThrownBy(() -> service.checkCap("unknownResource", 1))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
