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

import app.navilla.dto.ClientErrorRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Receives browser-side error reports so production frontend failures show up
 * in the server logs (and therefore Loki/Grafana) instead of dying silently in
 * users' browsers.
 *
 * <p>Public on purpose: errors also happen on login/signup pages where no
 * session exists. Fire-and-forget: nothing is persisted, the report becomes a
 * single WARN log line and the endpoint returns 204. Abuse is bounded by the
 * per-IP rate limit filter and the DTO size caps.
 */
@Slf4j
@RestController
@RequestMapping("/api/public/client-errors")
public class ClientErrorController {

  /**
   * Logs a client error report.
   *
   * @param request the error report
   * @return 204 No Content
   */
  @PostMapping
  public ResponseEntity<Void> report(@Valid @RequestBody ClientErrorRequest request) {
    log.warn("Client error: message=\"{}\" url=\"{}\" ua=\"{}\" stack=\"{}\"",
        sanitize(request.message()),
        sanitize(request.url()),
        sanitize(request.userAgent()),
        sanitize(request.stack()));
    return ResponseEntity.noContent().build();
  }

  /**
   * Collapses CR/LF/control characters to single spaces so a crafted payload
   * cannot forge extra log lines (log injection) in line-based aggregators.
   * Package-private for direct testing.
   *
   * @param value the raw client-supplied value
   * @return the sanitized value, never null
   */
  static String sanitize(String value) {
    if (value == null) {
      return "";
    }
    return value.replaceAll("[\\r\\n\\t\\p{Cntrl}]+", " ").trim();
  }
}
