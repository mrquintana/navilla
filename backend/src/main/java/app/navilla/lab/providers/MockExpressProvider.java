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

package app.navilla.lab.providers;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import app.navilla.lab.LabProvider;
import app.navilla.lab.LabProviderProperties;
import app.navilla.lab.LabTestResult;
import app.navilla.lab.LabVerificationResult;
import app.navilla.lab.ValidationResult;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Mock lab provider that calls the express mock endpoint.
 *
 * <p>Requires only {@code orderId}. Returns HIV + Syphilis results.
 */
public class MockExpressProvider implements LabProvider {

  private static final String PROVIDER_CODE = "MOCK_EXPRESS";

  private final LabProviderProperties properties;
  private final ObjectMapper objectMapper;

  public MockExpressProvider(LabProviderProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getProviderCode() {
    return PROVIDER_CODE;
  }

  @Override
  public ValidationResult validateInput(Map<String, String> visitCredentials) {
    String orderId = visitCredentials.getOrDefault("orderId", "");
    if (orderId.isBlank()) {
      return ValidationResult.invalid(Map.of("orderId", "orderId is required"));
    }
    return ValidationResult.ok();
  }

  @Override
  @SuppressWarnings("unchecked")
  public LabVerificationResult verify(
      Map<String, String> visitCredentials,
      Map<String, String> labCredentials) {

    String orderId = visitCredentials.getOrDefault("orderId", "");

    String baseUrl = resolveBaseUrl();
    String url = baseUrl + "/results"
        + "?orderId=" + URLEncoder.encode(orderId, StandardCharsets.UTF_8);

    try {
      HttpClient client = HttpClient.newHttpClient();
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(url))
          .GET()
          .build();

      HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());

      if (response.statusCode() != 200) {
        return LabVerificationResult.failure("HTTP_ERROR",
            "Lab API returned status " + response.statusCode());
      }

      byte[] rawBytes = response.body();
      Map<String, Object> body = objectMapper.readValue(rawBytes, Map.class);

      String status = (String) body.get("status");
      if (!"SUCCESS".equals(status)) {
        return LabVerificationResult.failure("LAB_ERROR", "Lab returned status: " + status);
      }

      String patientName = (String) body.get("patientName");
      LocalDate testDate = LocalDate.parse((String) body.get("testDate"));
      String labOrderId = (String) body.get("orderId");

      List<Map<String, String>> rawResults = (List<Map<String, String>>) body.get("results");
      List<LabTestResult> results = new ArrayList<>();

      for (Map<String, String> raw : rawResults) {
        String resultStr = normalizeResult(raw.get("result"));
        results.add(new LabTestResult(
            patientName,
            testDate,
            raw.get("condition"),
            resultStr,
            raw.get("resultValue"),
            raw.get("referenceRange"),
            labOrderId));
      }

      return LabVerificationResult.success(rawBytes, "application/json", results);
    } catch (Exception e) {
      return LabVerificationResult.failure("CONNECTION_ERROR", e.getMessage());
    }
  }

  private String resolveBaseUrl() {
    return properties.providers().stream()
        .filter(p -> PROVIDER_CODE.equals(p.code()))
        .findFirst()
        .map(LabProviderProperties.LabConfig::baseUrl)
        .orElse("http://localhost:8080");
  }

  private static String normalizeResult(String raw) {
    if (raw == null) {
      return "UNKNOWN";
    }
    return switch (raw.toUpperCase()) {
      case "REACTIVE" -> "POSITIVE";
      case "NON_REACTIVE" -> "NEGATIVE";
      default -> raw.toUpperCase();
    };
  }
}
