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

import java.util.Optional;

import app.navilla.dto.DevUserHashResponse;
import app.navilla.dto.ExposureDebugResponse;
import app.navilla.entity.User;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import app.navilla.service.ExposureService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dev-only endpoints for troubleshooting.
 */
@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevController {

  private final UserRepository userRepository;
  private final EncryptionService encryptionService;
  private final ExposureService exposureService;

  @Value("${navilla.dev-mode:false}")
  private boolean devMode;

  /**
   * Looks up a user's hashes by username or email (dev-only).
   *
   * @param username the username (optional)
   * @param email the email (optional)
   * @return user hash details
   */
  @GetMapping("/users/hash")
  public ResponseEntity<DevUserHashResponse> getUserHash(
      @RequestParam(name = "username", required = false) String username,
      @RequestParam(name = "email", required = false) String email) {

    if (!devMode) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    Optional<User> user = resolveUser(username, email);
    if (user.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    User resolved = user.get();
    DevUserHashResponse response = new DevUserHashResponse(
        resolved.getId(),
        resolved.getUsername(),
        resolved.getEmailHash(),
        resolved.getUsernameHash()
    );
    return ResponseEntity.ok(response);
  }

  /**
   * Provides debug exposure info for a user by username or email (dev-only).
   *
   * @param username the username (optional)
   * @param email the email (optional)
   * @return exposure debug response
   */
  @GetMapping("/exposures/inspect")
  public ResponseEntity<ExposureDebugResponse> inspectExposure(
      @RequestParam(name = "username", required = false) String username,
      @RequestParam(name = "email", required = false) String email) {

    if (!devMode) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    Optional<User> user = resolveUser(username, email);
    if (user.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    ExposureDebugResponse response = exposureService.getExposureDebug(user.get().getEmailHash());
    return ResponseEntity.ok(response);
  }

  private Optional<User> resolveUser(String username, String email) {
    if (email != null && !email.isBlank()) {
      String normalizedEmail = email.trim().toLowerCase();
      String hash = encryptionService.hashEmail(normalizedEmail);
      return userRepository.findByEmailHash(hash);
    }
    if (username != null && !username.isBlank()) {
      String normalizedUsername = normalizeUsername(username);
      String hash = encryptionService.hashUsername(normalizedUsername);
      return userRepository.findByUsernameHash(hash);
    }
    return Optional.empty();
  }

  private String normalizeUsername(String username) {
    String trimmed = username.trim();
    if (trimmed.startsWith("@")) {
      return trimmed.substring(1).toLowerCase();
    }
    return trimmed.toLowerCase();
  }
}
