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

import java.util.Locale;
import java.util.Map;

import app.navilla.config.EmailProperties;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends templated emails via the configured SMTP provider (SendGrid).
 *
 * <p>When {@code navilla.email.enabled} is {@code false}, all send operations
 * are silently skipped and logged at debug level, allowing safe local
 * development without an SMTP server.
 *
 * <p>Emails are fire-and-forget: failures are logged but never propagated
 * to callers, so a broken mail server cannot disrupt user-facing operations.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;
  private final EmailProperties emailProperties;
  private final EmailTemplateService emailTemplateService;

  /**
   * Sends a templated email to the specified recipient.
   *
   * <p>The template is resolved and rendered by {@link EmailTemplateService},
   * using the provided locale for language selection. If email is disabled
   * via configuration, the method returns immediately.
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
      log.debug("Email disabled, skipping send to {} (template: {})", to, templateName);
      return;
    }

    try {
      String htmlContent = emailTemplateService.render(templateName, variables, locale);

      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(new InternetAddress(emailProperties.from(), emailProperties.fromName()));
      helper.setReplyTo(emailProperties.replyTo());
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(htmlContent, true);

      mailSender.send(message);
      log.info("Email sent to {} (template: {})", to, templateName);
    } catch (Exception ex) {
      log.error("Failed to send email to {} (template: {}): {}",
          to, templateName, ex.getMessage(), ex);
    }
  }
}
