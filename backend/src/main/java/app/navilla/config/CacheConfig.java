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

import java.util.List;
import java.util.concurrent.TimeUnit;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Caffeine cache configuration with per-cache TTLs.
 *
 * <p>Named caches:
 * <ul>
 *   <li>{@code catalog} — global, 1 hour TTL (public health catalog data)</li>
 *   <li>{@code healthLogSummary} — per-user, 5 minute TTL</li>
 *   <li>{@code insights} — per-user, 5 minute TTL</li>
 *   <li>{@code prepStreak} — per-user, 10 minute TTL</li>
 * </ul>
 */
@Configuration
@EnableCaching
public class CacheConfig {

  /**
   * Creates a cache manager with named caches and individual TTLs.
   *
   * @return the configured cache manager
   */
  @Bean
  public CacheManager cacheManager() {
    SimpleCacheManager manager = new SimpleCacheManager();
    manager.setCaches(List.of(
        buildCache("catalog", 1, TimeUnit.HOURS, 1),
        buildCache("healthLogSummary", 5, TimeUnit.MINUTES, 500),
        buildCache("insights", 5, TimeUnit.MINUTES, 500),
        buildCache("prepStreak", 10, TimeUnit.MINUTES, 500)
    ));
    return manager;
  }

  private CaffeineCache buildCache(String name, long duration,
      TimeUnit unit, int maxSize) {
    return new CaffeineCache(name,
        Caffeine.newBuilder()
            .expireAfterWrite(duration, unit)
            .maximumSize(maxSize)
            .build());
  }
}
