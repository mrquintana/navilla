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

package app.navilla.config;

import java.util.Locale;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;

/**
 * Internationalization (i18n) configuration for the Navilla backend.
 *
 * <p>Configures message sources for translations and locale resolution
 * based on the Accept-Language header or a request parameter.
 *
 * <p>Supported locales:
 * <ul>
 *   <li>en_US - English (United States) - Default</li>
 *   <li>es_MX - Spanish (Mexico)</li>
 * </ul>
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@Configuration
public class MessageConfig implements WebMvcConfigurer {

  /**
   * Configures the message source for loading i18n messages.
   *
   * <p>Messages are loaded from classpath:messages*.properties files.
   *
   * @return configured MessageSource bean
   */
  @Bean
  public MessageSource messageSource() {
    ReloadableResourceBundleMessageSource messageSource =
        new ReloadableResourceBundleMessageSource();
    messageSource.setBasename("classpath:messages");
    messageSource.setDefaultEncoding("UTF-8");
    messageSource.setCacheSeconds(3600); // Reload messages every hour in production
    messageSource.setFallbackToSystemLocale(false);
    messageSource.setUseCodeAsDefaultMessage(true);
    return messageSource;
  }

  /**
   * Configures the locale resolver using Accept-Language header.
   *
   * <p>Falls back to en_US if no locale is specified or the locale is not supported.
   *
   * @return configured LocaleResolver bean
   */
  @Bean
  public LocaleResolver localeResolver() {
    AcceptHeaderLocaleResolver localeResolver = new AcceptHeaderLocaleResolver();
    localeResolver.setDefaultLocale(Locale.US);
    localeResolver.setSupportedLocales(java.util.List.of(
        Locale.US,
        Locale.forLanguageTag("es-MX")
    ));
    return localeResolver;
  }

  /**
   * Configures locale change interceptor for optional query parameter override.
   *
   * <p>Allows clients to specify locale via ?lang=es_MX query parameter.
   *
   * @return configured LocaleChangeInterceptor
   */
  @Bean
  public LocaleChangeInterceptor localeChangeInterceptor() {
    LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
    interceptor.setParamName("lang");
    return interceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(localeChangeInterceptor());
  }

  /**
   * Configures validation messages to use i18n message source.
   *
   * @return configured LocalValidatorFactoryBean
   */
  @Bean
  public LocalValidatorFactoryBean getValidator() {
    LocalValidatorFactoryBean bean = new LocalValidatorFactoryBean();
    bean.setValidationMessageSource(messageSource());
    return bean;
  }
}
