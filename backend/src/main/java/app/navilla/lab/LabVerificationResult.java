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

package app.navilla.lab;

import java.util.List;

/**
 * Result of a lab verification attempt.
 */
public record LabVerificationResult(
    boolean success,
    byte[] rawResponse,
    String contentType,
    List<LabTestResult> results,
    String errorCode,
    String errorMessage) {

  public static LabVerificationResult success(
      byte[] rawResponse, String contentType, List<LabTestResult> results) {
    return new LabVerificationResult(true, rawResponse, contentType, results, null, null);
  }

  public static LabVerificationResult failure(String errorCode, String errorMessage) {
    return new LabVerificationResult(false, null, null, List.of(), errorCode, errorMessage);
  }
}
