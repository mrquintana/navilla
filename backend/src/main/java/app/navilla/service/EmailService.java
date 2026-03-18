/*
 * Copyright 2026 Navilla
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package app.navilla.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;

import app.navilla.config.EmailProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Sends templated emails via SendGrid's HTTP API v3.
 *
 * <p>Uses HTTPS (port 443) instead of SMTP, which avoids port-blocking
 * issues on cloud providers like Railway.
 *
 * <p>When {@code navilla.email.enabled} is {@code false}, all send operations
 * are silently skipped and logged at debug level, allowing safe local
 * development without credentials.
 *
 * <p>Emails are fire-and-forget: failures are logged but never propagated
 * to callers, so a broken mail server cannot disrupt user-facing operations.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
public class EmailService {

  private static final String SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

  private final EmailProperties emailProperties;
  private final EmailTemplateService emailTemplateService;
  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  /**
   * Creates a new EmailService.
   *
   * @param emailProperties      email configuration properties
   * @param emailTemplateService template rendering service
   * @param objectMapper         JSON serializer for SendGrid payloads
   */
  public EmailService(EmailProperties emailProperties,
                      EmailTemplateService emailTemplateService,
                      ObjectMapper objectMapper) {
    this.emailProperties = emailProperties;
    this.emailTemplateService = emailTemplateService;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
  }

  /**
   * Sends a templated email to the specified recipient via SendGrid HTTP API.
   *
   * @param to           the recipient email address
   * @param subject      the email subject line
   * @param templateName the base template name (e.g. "digest")
   * @param variables    template model variables
   * @param locale       the locale for template rendering
   */
  public void sendTemplatedEmail(String to, String subject, String templateName,
                                  Map<String, Object> variables, Locale locale) {
    if (!emailProperties.enabled()) {
      log.debug("Email disabled, skipping send (template: {})", templateName);
      return;
    }

    try {
      String htmlContent = emailTemplateService.render(templateName, variables, locale);
      sendViaHttpApi(to, subject, htmlContent);
      log.info("Email sent (template: {})", templateName);
    } catch (Exception ex) {
      log.error("Failed to send email (template: {}): {}",
          templateName, ex.getMessage(), ex);
    }
  }

  /**
   * Sends an email via SendGrid's v3 HTTP API.
   */
  void sendViaHttpApi(String to, String subject, String htmlContent) throws Exception {
    String apiKey = emailProperties.sendgridApiKey();
    if (apiKey == null || apiKey.isBlank()) {
      log.warn("SendGrid API key not configured, skipping email");
      return;
    }

    // Build SendGrid v3 mail/send payload
    Map<String, Object> payload = Map.of(
        "personalizations", new Object[]{
            Map.of("to", new Object[]{Map.of("email", to)})
        },
        "from", Map.of(
            "email", emailProperties.from(),
            "name", emailProperties.fromName()
        ),
        "reply_to", Map.of("email", emailProperties.replyTo()),
        "subject", subject,
        "content", new Object[]{
            Map.of("type", "text/html", "value", htmlContent)
        }
    );

    String jsonBody = objectMapper.writeValueAsString(payload);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(SENDGRID_API_URL))
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json")
        .timeout(Duration.ofSeconds(10))
        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
        .build();

    HttpResponse<String> response = httpClient.send(request,
        HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() >= 200 && response.statusCode() < 300) {
      log.debug("SendGrid accepted email (HTTP {})", response.statusCode());
    } else {
      log.error("SendGrid rejected email (HTTP {}): {}",
          response.statusCode(), response.body());
      throw new RuntimeException("SendGrid HTTP " + response.statusCode()
          + ": " + response.body());
    }
  }
}
