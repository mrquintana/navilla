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

package app.navilla.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  @DisplayName("should return 200 without authentication")
  void shouldReturnCatalogWithoutAuth() throws Exception {
    mockMvc.perform(get("/api/catalog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.medicationTypes").isMap())
        .andExpect(jsonPath("$.frequencies").isMap())
        .andExpect(jsonPath("$.vaccineSeries").isMap());
  }

  @Test
  @DisplayName("should contain PREP_DAILY in medicationTypes")
  void shouldContainPrepDaily() throws Exception {
    mockMvc.perform(get("/api/catalog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.medicationTypes.PREP_DAILY").exists())
        .andExpect(jsonPath("$.medicationTypes.PREP_DAILY.labelKey").value("medications.type.prepDaily"))
        .andExpect(jsonPath("$.medicationTypes.PREP_DAILY.defaultFrequency").value("DAILY"))
        .andExpect(jsonPath("$.medicationTypes.PREP_DAILY.ongoing").value(true));
  }

  @Test
  @DisplayName("should contain HPV vaccine series with totalDoses=3")
  void shouldContainHpvVaccineSeries() throws Exception {
    mockMvc.perform(get("/api/catalog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.vaccineSeries.HPV").exists())
        .andExpect(jsonPath("$.vaccineSeries.HPV.labelKey").value("vaccinations.type.hpv"))
        .andExpect(jsonPath("$.vaccineSeries.HPV.totalDoses").value(3))
        .andExpect(jsonPath("$.vaccineSeries.HPV.doseIntervalsDays[0]").value(0))
        .andExpect(jsonPath("$.vaccineSeries.HPV.doseIntervalsDays[1]").value(60))
        .andExpect(jsonPath("$.vaccineSeries.HPV.doseIntervalsDays[2]").value(120));
  }
}
