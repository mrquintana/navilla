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

package app.navilla;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Integration tests for the Navilla Backend Application.
 *
 * <p>These tests verify that the Spring application context loads correctly
 * and all required beans are properly configured.
 *
 * @author Navilla Team
 * @version 0.0.1-SNAPSHOT
 * @since 2026-01-30
 */
@SpringBootTest
class NavillaBackendApplicationTests {

  /**
   * Verifies that the Spring application context loads successfully.
   *
   * <p>This test ensures that all Spring beans are properly configured
   * and there are no circular dependencies or missing beans.
   */
  @Test
  @DisplayName("Application context should load successfully")
  void contextLoads() {
    // Context loading is verified by Spring Boot test framework
    // If this test passes, the application context is valid
  }
}
