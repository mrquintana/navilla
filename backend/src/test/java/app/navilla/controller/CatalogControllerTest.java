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

  @Test
  @DisplayName("should contain encounter types list")
  void shouldContainEncounterTypes() throws Exception {
    mockMvc.perform(get("/api/catalog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encounterTypes").isArray())
        .andExpect(jsonPath("$.encounterTypes[0]").value("ORAL"))
        .andExpect(jsonPath("$.encounterTypes[1]").value("ANAL"))
        .andExpect(jsonPath("$.encounterTypes[2]").value("VAGINAL"))
        .andExpect(jsonPath("$.encounterTypes[3]").value("MANUAL"))
        .andExpect(jsonPath("$.encounterTypes[4]").value("OTHER"));
  }

  @Test
  @DisplayName("should contain protection methods list")
  void shouldContainProtectionMethods() throws Exception {
    mockMvc.perform(get("/api/catalog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.protectionMethods").isArray())
        .andExpect(jsonPath("$.protectionMethods[0]").value("CONDOM"))
        .andExpect(jsonPath("$.protectionMethods[1]").value("INTERNAL_CONDOM"))
        .andExpect(jsonPath("$.protectionMethods[2]").value("PREP"))
        .andExpect(jsonPath("$.protectionMethods[3]").value("PEP"))
        .andExpect(jsonPath("$.protectionMethods[4]").value("DENTAL_DAM"))
        .andExpect(jsonPath("$.protectionMethods[5]").value("NONE"))
        .andExpect(jsonPath("$.protectionMethods[6]").value("OTHER"));
  }

  // ---- Condition catalog endpoint ----

  @Test
  @DisplayName("should return conditions list without authentication")
  void shouldReturnConditionsWithoutAuth() throws Exception {
    mockMvc.perform(get("/api/catalog/conditions"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("should return conditions with expected fields")
  void shouldReturnConditionsWithFields() throws Exception {
    mockMvc.perform(get("/api/catalog/conditions"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].code").exists())
        .andExpect(jsonPath("$[0].displayName").exists())
        .andExpect(jsonPath("$[0].displayOrder").isNumber());
  }

  // ---- Network stages endpoint ----

  @Test
  @DisplayName("should return stages list without authentication")
  void shouldReturnStagesWithoutAuth() throws Exception {
    mockMvc.perform(get("/api/catalog/stages"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("should return stages with expected fields")
  void shouldReturnStagesWithFields() throws Exception {
    mockMvc.perform(get("/api/catalog/stages"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].code").exists())
        .andExpect(jsonPath("$[0].displayName").exists())
        .andExpect(jsonPath("$[0].minNodes").isNumber());
  }
}
