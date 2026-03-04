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

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collections;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

/**
 * Unit tests for {@link EmailTemplateService}.
 *
 * <p>Uses a real {@link SpringTemplateEngine} with
 * {@link ClassLoaderTemplateResolver} to verify template rendering
 * with variables and locale fallback behavior.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
class EmailTemplateServiceTest {

  private EmailTemplateService emailTemplateService;

  @BeforeEach
  void setUp() {
    ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
    resolver.setPrefix("templates/");
    resolver.setSuffix(".html");
    resolver.setTemplateMode("HTML");
    resolver.setCharacterEncoding("UTF-8");
    resolver.setCheckExistence(true);

    SpringTemplateEngine engine = new SpringTemplateEngine();
    engine.setTemplateResolver(resolver);

    emailTemplateService = new EmailTemplateService(engine);
  }

  @Nested
  @DisplayName("render")
  class Render {

    @Test
    @DisplayName("should render English digest template with variables")
    void shouldRenderEnglishDigestWithVariables() {
      Map<String, Object> variables = Map.of(
          "prepAdherenceRate", 95,
          "currentStreakDays", 14,
          "lastTestDate", "Jan 15, 2026",
          "daysSinceLastTest", 45,
          "upcomingReminders", Collections.emptyList(),
          "vaccineDueDates", Collections.emptyList()
      );

      String result = emailTemplateService.render("digest", variables, Locale.ENGLISH);

      assertThat(result).contains("Your Weekly Health Summary");
      assertThat(result).contains("PrEP Adherence");
      assertThat(result).contains("95");
      assertThat(result).contains("14");
      assertThat(result).contains("Jan 15, 2026");
    }

    @Test
    @DisplayName("should render Spanish digest template when locale is es")
    void shouldRenderSpanishDigestForSpanishLocale() {
      Map<String, Object> variables = Map.of(
          "prepAdherenceRate", 88,
          "currentStreakDays", 7,
          "lastTestDate", "15 Ene, 2026",
          "daysSinceLastTest", 30,
          "upcomingReminders", Collections.emptyList(),
          "vaccineDueDates", Collections.emptyList()
      );

      String result = emailTemplateService.render(
          "digest", variables, Locale.forLanguageTag("es"));

      assertThat(result).contains("Tu Resumen Semanal de Salud");
      assertThat(result).contains("Adherencia a PrEP");
      assertThat(result).contains("88");
      assertThat(result).contains("15 Ene, 2026");
    }

    @Test
    @DisplayName("should fall back to English when locale template not found")
    void shouldFallBackToEnglishWhenLocaleNotFound() {
      Map<String, Object> variables = Map.of(
          "prepAdherenceRate", 90,
          "currentStreakDays", 5,
          "upcomingReminders", Collections.emptyList(),
          "vaccineDueDates", Collections.emptyList()
      );

      // French locale — no fr template exists, should fall back to English
      String result = emailTemplateService.render(
          "digest", variables, Locale.FRENCH);

      assertThat(result).contains("Your Weekly Health Summary");
      assertThat(result).contains("PrEP Adherence");
    }
  }
}
