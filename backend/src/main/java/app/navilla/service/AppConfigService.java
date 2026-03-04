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

import app.navilla.entity.AppConfig;
import app.navilla.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for runtime application configuration via the app_config table.
 *
 * <p>Provides typed access to key-value configuration entries that can be
 * changed without redeployment. Values are cached and evicted on update.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppConfigService {

  private final AppConfigRepository appConfigRepository;

  /**
   * Returns the string value for the given config key, or the default if not found.
   *
   * @param key          the configuration key
   * @param defaultValue fallback value if key is missing
   * @return the config value or default
   */
  @Cacheable(value = "appConfig", key = "#key")
  public String getString(String key, String defaultValue) {
    return appConfigRepository.findByConfigKey(key)
        .map(AppConfig::getConfigValue)
        .orElse(defaultValue);
  }

  /**
   * Returns the integer value for the given config key, or the default if not found
   * or if the value cannot be parsed as an integer.
   *
   * @param key          the configuration key
   * @param defaultValue fallback value if key is missing or non-numeric
   * @return the parsed integer value or default
   */
  @Cacheable(value = "appConfig", key = "#key")
  public int getInt(String key, int defaultValue) {
    return appConfigRepository.findByConfigKey(key)
        .map(config -> {
          try {
            return Integer.parseInt(config.getConfigValue());
          } catch (NumberFormatException e) {
            log.warn("Config key '{}' has non-numeric value '{}', using default {}",
                key, config.getConfigValue(), defaultValue);
            return defaultValue;
          }
        })
        .orElse(defaultValue);
  }

  /**
   * Returns the boolean value for the given config key, or the default if not found.
   *
   * @param key          the configuration key
   * @param defaultValue fallback value if key is missing
   * @return the parsed boolean value or default
   */
  @Cacheable(value = "appConfig", key = "#key")
  public boolean getBoolean(String key, boolean defaultValue) {
    return appConfigRepository.findByConfigKey(key)
        .map(config -> Boolean.parseBoolean(config.getConfigValue()))
        .orElse(defaultValue);
  }

  /**
   * Sets a configuration value, creating or updating the entry.
   * Evicts the cached value for the key.
   *
   * @param key   the configuration key
   * @param value the value to set
   */
  @Transactional
  @CacheEvict(value = "appConfig", key = "#key")
  public void set(String key, String value) {
    AppConfig config = appConfigRepository.findByConfigKey(key)
        .orElseGet(() -> AppConfig.builder()
            .configKey(key)
            .build());
    config.setConfigValue(value);
    appConfigRepository.save(config);
    log.info("Config key '{}' set to '{}'", key, value);
  }
}
