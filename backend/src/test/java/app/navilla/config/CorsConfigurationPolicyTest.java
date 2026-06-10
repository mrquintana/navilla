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

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

/**
 * Guards the CORS allowlists in checked-in configuration.
 *
 * <p>Anyone can deploy a free app on {@code *.up.railway.app}, so wildcard
 * Railway origin patterns must never be active in the default or production
 * profiles. Spring's list binding means a base-profile list survives unless a
 * profile redefines it, so the wildcards have to be absent from BOTH files —
 * removing them only from application-production.yaml would let the base
 * values bind through. Staging is the only profile allowed to carry them.
 *
 * <p>Reads the yaml files from src/main/resources directly because the test
 * classpath shadows application.yaml with the test fixture.
 */
class CorsConfigurationPolicyTest {

  private static final Path MAIN_RESOURCES = Path.of("src", "main", "resources");

  @Test
  @DisplayName("default profile must not define wildcard origin patterns")
  void defaultProfileHasNoOriginPatterns() {
    assertThat(originPatterns("application.yaml")).isEmpty();
  }

  @Test
  @DisplayName("production profile must not define wildcard origin patterns")
  void productionProfileHasNoOriginPatterns() {
    assertThat(originPatterns("application-production.yaml")).isEmpty();
  }

  @Test
  @DisplayName("production profile only allows canonical https origins")
  void productionProfileOnlyAllowsCanonicalOrigins() {
    List<String> origins = allowedOrigins("application-production.yaml");
    assertThat(origins).isNotEmpty();
    assertThat(origins).allSatisfy(origin -> {
      assertThat(origin).startsWith("https://");
      assertThat(origin).doesNotContain("*");
    });
  }

  private List<String> originPatterns(String fileName) {
    return corsList(fileName, "allowed-origin-patterns");
  }

  private List<String> allowedOrigins(String fileName) {
    return corsList(fileName, "allowed-origins");
  }

  @SuppressWarnings("unchecked")
  private List<String> corsList(String fileName, String key) {
    try (InputStream in = Files.newInputStream(MAIN_RESOURCES.resolve(fileName))) {
      Map<String, Object> root = new Yaml().load(in);
      Map<String, Object> navilla =
          (Map<String, Object>) root.getOrDefault("navilla", Map.of());
      Map<String, Object> cors =
          (Map<String, Object>) navilla.getOrDefault("cors", Map.of());
      return (List<String>) cors.getOrDefault(key, List.of());
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to read " + fileName, ex);
    }
  }
}
