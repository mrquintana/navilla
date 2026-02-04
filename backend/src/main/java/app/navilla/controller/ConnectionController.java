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
import java.util.UUID;

import app.navilla.dto.ConnectionRequestResponse;
import app.navilla.dto.ConnectionResponse;
import app.navilla.dto.ConnectionStatsResponse;
import app.navilla.dto.CreateConnectionRequest;
import app.navilla.service.ConnectionService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for connection operations.
 *
 * <p>Provides endpoints for creating, managing, and viewing connections.
 * All endpoints require authentication via Supabase JWT.
 *
 * @author Navilla Team
 * @since 2026-01-31
 */
@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
public class ConnectionController {

  private final ConnectionService connectionService;

  /**
   * Creates a new connection request.
   *
   * @param jwt the JWT token containing user information
   * @param request the connection request with recipient email
   * @return the created connection
   */
  @PostMapping
  public ResponseEntity<ConnectionRequestResponse> createConnection(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateConnectionRequest request) {

    connectionService.createConnection(jwt, request);
    return ResponseEntity.status(HttpStatus.ACCEPTED)
        .body(new ConnectionRequestResponse("connection.success.requestQueued"));
  }

  /**
   * Gets all connections for the current user.
   *
   * @param jwt the JWT token containing user information
   * @return list of all connections
   */
  @GetMapping
  public ResponseEntity<List<ConnectionResponse>> getConnections(
      @AuthenticationPrincipal Jwt jwt) {

    List<ConnectionResponse> connections = connectionService.getConnections(jwt);
    return ResponseEntity.ok(connections);
  }

  /**
   * Gets confirmed connections for the current user.
   *
   * @param jwt the JWT token containing user information
   * @return list of confirmed connections
   */
  @GetMapping("/confirmed")
  public ResponseEntity<List<ConnectionResponse>> getConfirmedConnections(
      @AuthenticationPrincipal Jwt jwt) {

    List<ConnectionResponse> connections = connectionService.getConfirmedConnections(jwt);
    return ResponseEntity.ok(connections);
  }

  /**
   * Gets pending incoming connection requests.
   *
   * @param jwt the JWT token containing user information
   * @return list of pending incoming requests
   */
  @GetMapping("/pending/incoming")
  public ResponseEntity<List<ConnectionResponse>> getPendingIncoming(
      @AuthenticationPrincipal Jwt jwt) {

    List<ConnectionResponse> connections = connectionService.getPendingIncoming(jwt);
    return ResponseEntity.ok(connections);
  }

  /**
   * Gets pending sent connection requests.
   *
   * @param jwt the JWT token containing user information
   * @return list of pending sent requests
   */
  @GetMapping("/pending/sent")
  public ResponseEntity<List<ConnectionResponse>> getPendingSent(
      @AuthenticationPrincipal Jwt jwt) {

    List<ConnectionResponse> connections = connectionService.getPendingSent(jwt);
    return ResponseEntity.ok(connections);
  }

  /**
   * Gets connection statistics for the current user.
   *
   * @param jwt the JWT token containing user information
   * @return connection statistics
   */
  @GetMapping("/stats")
  public ResponseEntity<ConnectionStatsResponse> getStats(
      @AuthenticationPrincipal Jwt jwt) {

    ConnectionStatsResponse stats = connectionService.getStats(jwt);
    return ResponseEntity.ok(stats);
  }

  /**
   * Accepts a pending connection request.
   *
   * @param jwt the JWT token containing user information
   * @param id the connection ID to accept
   * @return the updated connection
   */
  @PostMapping("/{id}/accept")
  public ResponseEntity<ConnectionResponse> acceptConnection(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {

    ConnectionResponse connection = connectionService.acceptConnection(jwt, id);
    return ResponseEntity.ok(connection);
  }

  /**
   * Denies a pending connection request.
   *
   * @param jwt the JWT token containing user information
   * @param id the connection ID to deny
   * @return the updated connection
   */
  @PostMapping("/{id}/deny")
  public ResponseEntity<ConnectionResponse> denyConnection(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {

    ConnectionResponse connection = connectionService.denyConnection(jwt, id);
    return ResponseEntity.ok(connection);
  }

  /**
   * Cancels a pending connection request (requester only).
   *
   * @param jwt the JWT token containing user information
   * @param id the connection ID to cancel
   * @return 204 No Content on success
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> cancelConnection(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {

    connectionService.cancelConnection(jwt, id);
    return ResponseEntity.noContent().build();
  }
}
