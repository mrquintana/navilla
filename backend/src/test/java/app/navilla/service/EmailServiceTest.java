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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link EmailService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

  @Mock
  private EmailProperties emailProperties;

  @Mock
  private EmailTemplateService emailTemplateService;

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

      EmailService emailService = new EmailService(
          emailProperties, emailTemplateService, new ObjectMapper());

      emailService.sendTemplatedEmail(TO, SUBJECT, TEMPLATE, VARIABLES, LOCALE);

      verify(emailTemplateService, never()).render(any(), any(), any());
    }

    @Test
    @DisplayName("should render template when enabled")
    void shouldRenderTemplateWhenEnabled() {
      when(emailProperties.enabled()).thenReturn(true);
      when(emailProperties.sendgridApiKey()).thenReturn(null);
      when(emailTemplateService.render(eq(TEMPLATE), eq(VARIABLES), eq(LOCALE)))
          .thenReturn("<html><body>Hello</body></html>");

      EmailService emailService = new EmailService(
          emailProperties, emailTemplateService, new ObjectMapper());

      // Will skip actual send because API key is null, but template is rendered
      emailService.sendTemplatedEmail(TO, SUBJECT, TEMPLATE, VARIABLES, LOCALE);

      verify(emailTemplateService).render(eq(TEMPLATE), eq(VARIABLES), eq(LOCALE));
    }

    @Test
    @DisplayName("should not throw when template rendering fails")
    void shouldNotThrowOnFailure() {
      when(emailProperties.enabled()).thenReturn(true);
      when(emailTemplateService.render(any(), any(), any()))
          .thenThrow(new RuntimeException("Template not found"));

      EmailService emailService = new EmailService(
          emailProperties, emailTemplateService, new ObjectMapper());

      // No exception should propagate — fire and forget
      emailService.sendTemplatedEmail(TO, SUBJECT, TEMPLATE, VARIABLES, LOCALE);
    }
  }
}
