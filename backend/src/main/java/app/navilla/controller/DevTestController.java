/*
 * TEMPORARY — remove after validating email delivery.
 */

package app.navilla.controller;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import app.navilla.config.EmailProperties;
import app.navilla.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Temporary controller for testing email delivery.
 * Requires authentication (JWT). Remove after validation.
 */
@Slf4j
@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevTestController {

  private final EmailService emailService;
  private final EmailProperties emailProperties;

  @GetMapping("/email-status")
  public ResponseEntity<Map<String, Object>> emailStatus(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(Map.of(
        "emailEnabled", emailProperties.enabled(),
        "from", emailProperties.from(),
        "fromName", emailProperties.fromName(),
        "replyTo", emailProperties.replyTo()));
  }

  @PostMapping("/test-email")
  public ResponseEntity<Map<String, String>> sendTestEmail(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody Map<String, String> request) {
    String to = request.get("to");
    if (to == null || to.isBlank()) {
      return ResponseEntity.badRequest()
          .body(Map.of("error", "Missing 'to' field"));
    }

    String locale = request.getOrDefault("locale", "en");

    // Fire off email in a separate thread so the HTTP response returns immediately
    Thread.startVirtualThread(() -> {
      log.info("Sending test email to {} (locale: {})", to, locale);
      emailService.sendTemplatedEmail(
          to,
          "Navilla — Test Email",
          "digest",
          Map.of(
              "prepAdherenceRate", 95,
              "currentStreakDays", 14,
              "lastTestDate", "Feb 15, 2026",
              "daysSinceLastTest", 17,
              "upcomingReminders", List.of(
                  "PrEP refill — Mar 10",
                  "STI testing — Mar 15"
              ),
              "vaccineDueDates", List.of(
                  "HPV dose 2 — Apr 1"
              )
          ),
          Locale.forLanguageTag(locale));
      log.info("Test email to {} completed", to);
    });

    return ResponseEntity.ok(Map.of(
        "status", "queued",
        "to", to,
        "template", "digest_" + locale,
        "note", "Check Railway logs for delivery result"));
  }
}
