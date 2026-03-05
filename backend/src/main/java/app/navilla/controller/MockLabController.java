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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dev-only controller that simulates external lab API responses.
 *
 * <p>These endpoints are unauthenticated (no JWT required) because they
 * stand in for third-party lab systems that our {@code LabProvider}
 * implementations call via HTTP.
 *
 * <p>Returns 404 when {@code navilla.dev-mode} is false.
 */
@RestController
@RequestMapping("/api/dev/mock-labs")
public class MockLabController {

  @Value("${navilla.dev-mode:false}")
  private boolean devMode;

  /**
   * Simulates a full-panel lab (4 conditions) like a Mexican commercial lab.
   *
   * @param orderId   the order identifier
   * @param patientId the patient identifier
   * @return mock lab results JSON
   */
  @GetMapping("/demo-mx/results")
  public ResponseEntity<Map<String, Object>> getDemoMxResults(
      @RequestParam(name = "orderId", required = false) String orderId,
      @RequestParam(name = "patientId", required = false) String patientId) {

    if (!devMode) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    if (orderId == null || orderId.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "orderId is required"));
    }
    if (patientId == null || patientId.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "patientId is required"));
    }

    LocalDate testDate = LocalDate.now().minusDays(3);
    boolean chlamydiaPositive = orderId.hashCode() % 3 == 0;

    List<Map<String, String>> results = new ArrayList<>();
    results.add(buildResult("CHLAMYDIA",
        chlamydiaPositive ? "POSITIVE" : "NEGATIVE",
        chlamydiaPositive ? "Detected" : "Not detected",
        "Not detected"));
    results.add(buildResult("GONORRHEA", "NEGATIVE", "Not detected", "Not detected"));
    results.add(buildResult("SYPHILIS", "NEGATIVE", "0.2 RPR", "< 1.0 RPR"));
    results.add(buildResult("HIV", "NEGATIVE", "Non-reactive", "Non-reactive"));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("status", "SUCCESS");
    response.put("orderId", orderId);
    response.put("patientName", "Demo Patient " + patientId);
    response.put("testDate", testDate.toString());
    response.put("labName", "Lab Demo MX");
    response.put("results", results);

    return ResponseEntity.ok(response);
  }

  /**
   * Simulates a rapid/express lab (2 conditions: HIV + Syphilis).
   *
   * @param orderId the order identifier
   * @return mock lab results JSON
   */
  @GetMapping("/express/results")
  public ResponseEntity<Map<String, Object>> getExpressResults(
      @RequestParam(name = "orderId", required = false) String orderId) {

    if (!devMode) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    if (orderId == null || orderId.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "orderId is required"));
    }

    LocalDate testDate = LocalDate.now().minusDays(1);
    boolean hivReactive = orderId.hashCode() % 5 == 0;

    List<Map<String, String>> results = new ArrayList<>();
    results.add(buildResult("HIV",
        hivReactive ? "REACTIVE" : "NON_REACTIVE",
        hivReactive ? "Reactive" : "Non-reactive",
        "Non-reactive"));
    results.add(buildResult("SYPHILIS", "NON_REACTIVE", "Non-reactive", "Non-reactive"));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("status", "SUCCESS");
    response.put("orderId", orderId);
    response.put("patientName", "Express Patient");
    response.put("testDate", testDate.toString());
    response.put("labName", "Express Lab");
    response.put("results", results);

    return ResponseEntity.ok(response);
  }

  private static Map<String, String> buildResult(
      String condition, String result, String resultValue, String referenceRange) {
    Map<String, String> r = new LinkedHashMap<>();
    r.put("condition", condition);
    r.put("result", result);
    r.put("resultValue", resultValue);
    r.put("referenceRange", referenceRange);
    return r;
  }
}
