/*
 * TEMPORARY — remove after validating email delivery.
 */

package app.navilla.controller;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import app.navilla.config.EmailProperties;
import app.navilla.service.EmailTemplateService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

  private final JavaMailSender mailSender;
  private final EmailProperties emailProperties;
  private final EmailTemplateService emailTemplateService;

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

    if (!emailProperties.enabled()) {
      return ResponseEntity.ok(Map.of(
          "status", "skipped",
          "reason", "EMAIL_ENABLED is false"));
    }

    String locale = request.getOrDefault("locale", "en");

    try {
      String htmlContent = emailTemplateService.render("digest",
          Map.of(
              "prepAdherenceRate", 95,
              "currentStreakDays", 14,
              "lastTestDate", "Feb 15, 2026",
              "daysSinceLastTest", 17,
              "upcomingReminders", List.of(
                  "PrEP refill — Mar 10",
                  "STI testing — Mar 15"),
              "vaccineDueDates", List.of(
                  "HPV dose 2 — Apr 1")),
          Locale.forLanguageTag(locale));

      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(new InternetAddress(emailProperties.from(), emailProperties.fromName()));
      helper.setReplyTo(emailProperties.replyTo());
      helper.setTo(to);
      helper.setSubject("Navilla — Test Email (" + locale + ")");
      helper.setText(htmlContent, true);

      mailSender.send(message);

      return ResponseEntity.ok(Map.of(
          "status", "sent",
          "to", to,
          "from", emailProperties.from(),
          "template", "digest_" + locale));
    } catch (Exception ex) {
      log.error("Test email failed: {}", ex.getMessage(), ex);
      return ResponseEntity.internalServerError()
          .body(Map.of(
              "status", "failed",
              "error", ex.getClass().getSimpleName() + ": " + ex.getMessage()));
    }
  }
}
