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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.AppConfig;
import app.navilla.repository.AppConfigRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link AppConfigService}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class AppConfigServiceTest {

  @Mock
  private AppConfigRepository appConfigRepository;

  @InjectMocks
  private AppConfigService appConfigService;

  private AppConfig buildConfig(String key, String value) {
    return AppConfig.builder()
        .id(UUID.randomUUID())
        .configKey(key)
        .configValue(value)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @Nested
  @DisplayName("getString")
  class GetString {

    @Test
    @DisplayName("existing key returns value")
    void existingKeyReturnsValue() {
      when(appConfigRepository.findByConfigKey("phone_match.window_days"))
          .thenReturn(Optional.of(buildConfig("phone_match.window_days", "2")));

      String result = appConfigService.getString("phone_match.window_days", "7");

      assertThat(result).isEqualTo("2");
    }

    @Test
    @DisplayName("missing key returns default value")
    void missingKeyReturnsDefault() {
      when(appConfigRepository.findByConfigKey("nonexistent.key"))
          .thenReturn(Optional.empty());

      String result = appConfigService.getString("nonexistent.key", "fallback");

      assertThat(result).isEqualTo("fallback");
    }
  }

  @Nested
  @DisplayName("getInt")
  class GetInt {

    @Test
    @DisplayName("parses numeric value correctly")
    void parsesNumericValueCorrectly() {
      when(appConfigRepository.findByConfigKey("exposure.max_depth"))
          .thenReturn(Optional.of(buildConfig("exposure.max_depth", "3")));

      int result = appConfigService.getInt("exposure.max_depth", 5);

      assertThat(result).isEqualTo(3);
    }

    @Test
    @DisplayName("non-numeric value returns default")
    void nonNumericValueReturnsDefault() {
      when(appConfigRepository.findByConfigKey("bad.number"))
          .thenReturn(Optional.of(buildConfig("bad.number", "not-a-number")));

      int result = appConfigService.getInt("bad.number", 42);

      assertThat(result).isEqualTo(42);
    }

    @Test
    @DisplayName("missing key returns default")
    void missingKeyReturnsDefault() {
      when(appConfigRepository.findByConfigKey("missing.int"))
          .thenReturn(Optional.empty());

      int result = appConfigService.getInt("missing.int", 10);

      assertThat(result).isEqualTo(10);
    }
  }

  @Nested
  @DisplayName("getBoolean")
  class GetBoolean {

    @Test
    @DisplayName("parses true value correctly")
    void parsesTrueValueCorrectly() {
      when(appConfigRepository.findByConfigKey("feature.enabled"))
          .thenReturn(Optional.of(buildConfig("feature.enabled", "true")));

      boolean result = appConfigService.getBoolean("feature.enabled", false);

      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("parses false value correctly")
    void parsesFalseValueCorrectly() {
      when(appConfigRepository.findByConfigKey("feature.disabled"))
          .thenReturn(Optional.of(buildConfig("feature.disabled", "false")));

      boolean result = appConfigService.getBoolean("feature.disabled", true);

      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("missing key returns default")
    void missingKeyReturnsDefault() {
      when(appConfigRepository.findByConfigKey("missing.bool"))
          .thenReturn(Optional.empty());

      boolean result = appConfigService.getBoolean("missing.bool", true);

      assertThat(result).isTrue();
    }
  }

  @Nested
  @DisplayName("set")
  class Set {

    @Test
    @DisplayName("creates new entry when key does not exist")
    void createsNewEntryWhenKeyDoesNotExist() {
      when(appConfigRepository.findByConfigKey("new.key"))
          .thenReturn(Optional.empty());
      when(appConfigRepository.save(any(AppConfig.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      appConfigService.set("new.key", "new-value");

      ArgumentCaptor<AppConfig> captor = ArgumentCaptor.forClass(AppConfig.class);
      verify(appConfigRepository).save(captor.capture());
      AppConfig saved = captor.getValue();
      assertThat(saved.getConfigKey()).isEqualTo("new.key");
      assertThat(saved.getConfigValue()).isEqualTo("new-value");
    }

    @Test
    @DisplayName("updates existing entry when key exists")
    void updatesExistingEntryWhenKeyExists() {
      var existing = buildConfig("existing.key", "old-value");
      when(appConfigRepository.findByConfigKey("existing.key"))
          .thenReturn(Optional.of(existing));
      when(appConfigRepository.save(any(AppConfig.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      appConfigService.set("existing.key", "updated-value");

      ArgumentCaptor<AppConfig> captor = ArgumentCaptor.forClass(AppConfig.class);
      verify(appConfigRepository).save(captor.capture());
      AppConfig saved = captor.getValue();
      assertThat(saved.getConfigKey()).isEqualTo("existing.key");
      assertThat(saved.getConfigValue()).isEqualTo("updated-value");
    }
  }
}
