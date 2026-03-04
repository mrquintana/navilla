/*
 * TEMPORARY — remove after validating email delivery.
 */

package app.navilla.controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import app.navilla.config.EmailProperties;
import app.navilla.service.EmailTemplateService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

  private final EmailProperties emailProperties;
  private final EmailTemplateService emailTemplateService;
  private final ObjectMapper objectMapper;

  @GetMapping("/email-status")
  public ResponseEntity<Map<String, Object>> emailStatus(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(Map.of(
        "emailEnabled", emailProperties.enabled(),
        "from", emailProperties.from(),
        "fromName", emailProperties.fromName(),
        "replyTo", emailProperties.replyTo(),
        "hasApiKey", emailProperties.sendgridApiKey() != null
            && !emailProperties.sendgridApiKey().isBlank()));
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

    String apiKey = emailProperties.sendgridApiKey();
    if (apiKey == null || apiKey.isBlank()) {
      return ResponseEntity.ok(Map.of(
          "status", "skipped",
          "reason", "SENDGRID_API_KEY not set"));
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

      // Direct SendGrid HTTP API call for clear error reporting
      Map<String, Object> payload = Map.of(
          "personalizations", new Object[]{
              Map.of("to", new Object[]{Map.of("email", to)})},
          "from", Map.of(
              "email", emailProperties.from(),
              "name", emailProperties.fromName()),
          "reply_to", Map.of("email", emailProperties.replyTo()),
          "subject", "Navilla — Test Email (" + locale + ")",
          "content", new Object[]{
              Map.of("type", "text/html", "value", htmlContent)});

      String jsonBody = objectMapper.writeValueAsString(payload);

      HttpClient client = HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(10)).build();
      HttpRequest httpRequest = HttpRequest.newBuilder()
          .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
          .header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json")
          .timeout(Duration.ofSeconds(10))
          .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
          .build();

      HttpResponse<String> response = client.send(httpRequest,
          HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        return ResponseEntity.ok(Map.of(
            "status", "sent",
            "httpCode", String.valueOf(response.statusCode()),
            "to", to,
            "from", emailProperties.from()));
      } else {
        return ResponseEntity.internalServerError()
            .body(Map.of(
                "status", "rejected",
                "httpCode", String.valueOf(response.statusCode()),
                "error", response.body()));
      }
    } catch (Exception ex) {
      return ResponseEntity.internalServerError()
          .body(Map.of(
              "status", "failed",
              "error", ex.getClass().getSimpleName() + ": " + ex.getMessage()));
    }
  }
}
