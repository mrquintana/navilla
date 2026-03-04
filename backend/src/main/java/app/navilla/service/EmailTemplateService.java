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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.exceptions.TemplateInputException;
import org.thymeleaf.spring6.SpringTemplateEngine;

/**
 * Renders Thymeleaf email templates with locale-aware fallback.
 *
 * <p>Templates are resolved from {@code templates/email/} by convention.
 * The service first attempts to resolve a locale-specific template
 * (e.g. {@code email/digest_es}), falling back to English
 * ({@code email/digest_en}) if not found.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailTemplateService {

  private final SpringTemplateEngine templateEngine;

  /**
   * Renders the given email template with the supplied variables and locale.
   *
   * <p>The template is looked up as {@code email/{templateName}_{lang}},
   * where {@code lang} is derived from the provided locale. If the
   * locale-specific template does not exist, English is used as fallback.
   *
   * @param templateName the base template name (e.g. "digest")
   * @param variables    template model variables
   * @param locale       the desired locale for rendering
   * @return the rendered HTML string
   */
  public String render(String templateName, Map<String, Object> variables, Locale locale) {
    Context context = new Context(locale);
    context.setVariables(variables);

    String localizedTemplate = "email/" + templateName + "_" + locale.getLanguage();

    try {
      return templateEngine.process(localizedTemplate, context);
    } catch (TemplateInputException ex) {
      log.warn("Template '{}' not found, falling back to English", localizedTemplate);
      String fallbackTemplate = "email/" + templateName + "_en";
      return templateEngine.process(fallbackTemplate, context);
    }
  }
}
