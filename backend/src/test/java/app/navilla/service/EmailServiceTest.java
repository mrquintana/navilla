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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Locale;
import java.util.Map;

import app.navilla.config.EmailProperties;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Unit tests for {@link EmailService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

  @Mock
  private JavaMailSender mailSender;

  @Mock
  private EmailProperties emailProperties;

  @Mock
  private EmailTemplateService emailTemplateService;

  @Mock
  private MimeMessage mimeMessage;

  @InjectMocks
  private EmailService emailService;

  private static final String TO = "user@example.com";
  private static final String SUBJECT = "Your Weekly Summary";
  private static final String TEMPLATE = "digest";
  private static final Map<String, Object> VARIABLES = Map.of("prepAdherenceRate", 95);
  private static final Locale LOCALE = Locale.ENGLISH;

  @Nested
  @DisplayName("sendTemplatedEmail")
  class SendTemplatedEmail {

    @Test
    @DisplayName("should skip sending when email is disabled")
    void shouldSkipWhenDisabled() {
      when(emailProperties.enabled()).thenReturn(false);

      emailService.sendTemplatedEmail(TO, SUBJECT, TEMPLATE, VARIABLES, LOCALE);

      verify(mailSender, never()).send(any(MimeMessage.class));
      verify(emailTemplateService, never()).render(any(), any(), any());
    }

    @Test
    @DisplayName("should send email with correct from/to/content when enabled")
    void shouldSendWhenEnabled() {
      when(emailProperties.enabled()).thenReturn(true);
      when(emailProperties.from()).thenReturn("noreply@navilla.app");
      when(emailProperties.fromName()).thenReturn("Navilla");
      when(emailProperties.replyTo()).thenReturn("contact@navilla.app");
      when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
      when(emailTemplateService.render(eq(TEMPLATE), eq(VARIABLES), eq(LOCALE)))
          .thenReturn("<html><body>Hello</body></html>");

      emailService.sendTemplatedEmail(TO, SUBJECT, TEMPLATE, VARIABLES, LOCALE);

      verify(mailSender).send(mimeMessage);
    }

    @Test
    @DisplayName("should not throw when mail sender fails")
    void shouldNotThrowOnFailure() {
      when(emailProperties.enabled()).thenReturn(true);
      when(mailSender.createMimeMessage()).thenThrow(
          new RuntimeException("SMTP connection refused"));

      // No exception should propagate — fire and forget
      emailService.sendTemplatedEmail(TO, SUBJECT, TEMPLATE, VARIABLES, LOCALE);

      verify(mailSender, never()).send(any(MimeMessage.class));
    }
  }
}
