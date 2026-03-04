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

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;

/**
 * Tests for {@link CacheConfig}.
 */
class CacheConfigTest {

  private final CacheConfig cacheConfig = new CacheConfig();

  @Test
  @DisplayName("cacheManager creates all expected named caches")
  void cacheManagerCreatesExpectedCaches() {
    CacheManager manager = cacheConfig.cacheManager();

    // SimpleCacheManager requires afterPropertiesSet to be called
    ((org.springframework.cache.support.SimpleCacheManager) manager)
        .afterPropertiesSet();

    assertThat(manager.getCache("catalog")).isNotNull();
    assertThat(manager.getCache("appConfig")).isNotNull();
    assertThat(manager.getCache("healthLogSummary")).isNotNull();
    assertThat(manager.getCache("insights")).isNotNull();
    assertThat(manager.getCache("prepStreak")).isNotNull();
  }

  @Test
  @DisplayName("cacheManager returns null for unknown cache names")
  void cacheManagerReturnsNullForUnknownCache() {
    CacheManager manager = cacheConfig.cacheManager();
    ((org.springframework.cache.support.SimpleCacheManager) manager)
        .afterPropertiesSet();

    assertThat(manager.getCache("nonExistent")).isNull();
  }

  @Test
  @DisplayName("cache names collection matches expected set")
  void cacheNamesMatchExpectedSet() {
    CacheManager manager = cacheConfig.cacheManager();
    ((org.springframework.cache.support.SimpleCacheManager) manager)
        .afterPropertiesSet();

    assertThat(manager.getCacheNames())
        .containsExactlyInAnyOrder(
            "catalog", "appConfig", "healthLogSummary", "insights", "prepStreak");
  }
}
