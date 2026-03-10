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

import java.util.List;

import app.navilla.dto.CreateVerificationCardRequest;
import app.navilla.dto.PublicVerificationCardResponse;
import app.navilla.dto.UpdateVerificationCardRequest;
import app.navilla.dto.VerificationCardResponse;
import app.navilla.security.EncryptionService;
import app.navilla.service.VerificationCardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class VerificationCardController {

  private final VerificationCardService verificationCardService;
  private final EncryptionService encryptionService;

  @PostMapping("/api/verification-cards")
  public ResponseEntity<VerificationCardResponse> create(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateVerificationCardRequest request) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(verificationCardService.createCard(userHash, request));
  }

  @GetMapping("/api/verification-cards")
  public ResponseEntity<List<VerificationCardResponse>> list(
      @AuthenticationPrincipal Jwt jwt) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    return ResponseEntity.ok(verificationCardService.getUserCards(userHash));
  }

  @PutMapping("/api/verification-cards/{id}")
  public ResponseEntity<VerificationCardResponse> update(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String id,
      @Valid @RequestBody UpdateVerificationCardRequest request) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    return ResponseEntity.ok(verificationCardService.updateCard(userHash, id, request));
  }

  @DeleteMapping("/api/verification-cards/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String id) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    verificationCardService.deleteCard(userHash, id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/api/public/cards/{shareToken}")
  public ResponseEntity<PublicVerificationCardResponse> getPublicCard(
      @PathVariable String shareToken) {
    return ResponseEntity.ok(verificationCardService.getPublicCard(shareToken));
  }
}
