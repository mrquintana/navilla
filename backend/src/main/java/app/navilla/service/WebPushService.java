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

package app.navilla.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

import app.navilla.config.PushProperties;
import app.navilla.dto.PushPayload;
import app.navilla.entity.PushSubscription;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.springframework.stereotype.Service;

/**
 * Service for sending web push notifications via VAPID (RFC 8292) and RFC 8030.
 *
 * <p>Handles VAPID JWT token generation and push message delivery. Subscription
 * data (endpoint, p256dh, auth) is decrypted from the database before use.
 *
 * <p><strong>Current limitation:</strong> RFC 8291 payload encryption (aes128gcm)
 * is not yet implemented. Push messages are sent without encrypted payload content,
 * which means only "tickle" (empty-body) pushes work with standards-compliant push
 * services. Full payload encryption will be wired up when a compatible library is
 * integrated.
 *
 * <p>Fire-and-forget: all exceptions are caught and logged, never thrown.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebPushService {

  private static final int VAPID_EXPIRY_HOURS = 12;
  private static final int HTTP_GONE = 410;
  private static final int HTTP_NOT_FOUND = 404;
  private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(30);

  private final PushProperties pushProperties;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;

  private HttpClient httpClient;
  private boolean configured;

  /**
   * Initializes the HTTP client and validates VAPID configuration.
   */
  @PostConstruct
  void init() {
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(HTTP_TIMEOUT)
        .build();

    this.configured = pushProperties.vapidPublicKey() != null
        && !pushProperties.vapidPublicKey().isBlank()
        && pushProperties.vapidPrivateKey() != null
        && !pushProperties.vapidPrivateKey().isBlank();

    if (configured) {
      log.info("Web Push service initialized — VAPID keys configured");
    } else {
      log.warn("Web Push service initialized — VAPID keys NOT configured, "
          + "push notifications will be skipped");
    }
  }

  /**
   * Sends a push notification to a single subscription.
   *
   * <p>Decrypts the subscription's endpoint, p256dh key, and auth secret,
   * then delivers the notification via HTTP POST with a VAPID authorization header.
   *
   * <p>Returns {@code true} if the push was accepted (HTTP 2xx), {@code false}
   * otherwise. HTTP 404/410 responses indicate a stale subscription that the
   * caller should delete.
   *
   * @param subscription the push subscription entity (encrypted fields)
   * @param payload the notification content
   * @return true if the push was successfully delivered
   */
  public boolean sendPush(PushSubscription subscription, PushPayload payload) {
    if (!configured) {
      log.warn("Push not configured — skipping notification to subscription {}",
          subscription.getId());
      return false;
    }

    try {
      // Decrypt subscription data
      String endpoint = encryptionService.decryptFromBytes(
          subscription.getEndpointEncrypted());
      String p256dh = encryptionService.decryptFromBytes(
          subscription.getP256dhEncrypted());
      String auth = encryptionService.decryptFromBytes(
          subscription.getAuthEncrypted());

      // Build the notification JSON payload
      String payloadJson = objectMapper.writeValueAsString(payload);

      // Generate VAPID Authorization header
      URI endpointUri = URI.create(endpoint);
      String audience = endpointUri.getScheme() + "://" + endpointUri.getHost();
      String vapidToken = generateVapidToken(audience);

      // Send push notification
      // NOTE: Full RFC 8291 content encryption (aes128gcm) is not yet implemented.
      // The payload is sent as plaintext in the body. For production use with
      // encrypted payloads, integrate a library that handles ECDH key agreement
      // + HKDF + aes128gcm content encoding using the subscriber's p256dh and auth keys.
      log.debug("Sending push to endpoint: {} (p256dh present: {}, auth present: {})",
          endpoint, p256dh != null && !p256dh.isEmpty(), auth != null && !auth.isEmpty());

      HttpRequest request = HttpRequest.newBuilder()
          .uri(endpointUri)
          .timeout(HTTP_TIMEOUT)
          .header("Authorization", vapidToken)
          .header("Content-Type", "application/json")
          .header("TTL", "86400")
          .header("Urgency", "normal")
          .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
          .build();

      HttpResponse<String> response = httpClient.send(request,
          HttpResponse.BodyHandlers.ofString());

      int statusCode = response.statusCode();

      if (statusCode >= 200 && statusCode < 300) {
        log.info("Push notification delivered to subscription {} (HTTP {})",
            subscription.getId(), statusCode);
        return true;
      }

      if (statusCode == HTTP_NOT_FOUND || statusCode == HTTP_GONE) {
        log.warn("Stale subscription {} — push endpoint returned HTTP {} "
            + "(caller should delete)", subscription.getId(), statusCode);
      } else {
        log.warn("Push delivery failed for subscription {} — HTTP {}: {}",
            subscription.getId(), statusCode, response.body());
      }

      return false;

    } catch (Exception ex) {
      log.error("Push delivery failed for subscription {} — {}",
          subscription.getId(), ex.getMessage(), ex);
      return false;
    }
  }

  /**
   * Sends a push notification to all subscriptions for a given user.
   *
   * @param userHash the hashed user identifier
   * @param payload the notification content
   * @param subscriptionService the service to retrieve subscriptions
   * @return the number of successful push deliveries
   */
  public int sendPushToUser(String userHash, PushPayload payload,
      PushSubscriptionService subscriptionService) {
    List<PushSubscription> subscriptions =
        subscriptionService.getSubscriptionsForUserHash(userHash);

    if (subscriptions.isEmpty()) {
      log.debug("No push subscriptions for user hash: {}", userHash);
      return 0;
    }

    int successCount = 0;
    for (PushSubscription subscription : subscriptions) {
      if (sendPush(subscription, payload)) {
        successCount++;
      }
    }

    log.info("Push notifications sent to user {}: {}/{} successful",
        userHash, successCount, subscriptions.size());
    return successCount;
  }

  /**
   * Generates a VAPID Authorization header value (RFC 8292).
   *
   * <p>Creates a JWT signed with ES256 containing the audience and expiry claims,
   * then formats it as a {@code vapid t=<jwt>,k=<publicKey>} header value.
   *
   * @param audience the origin of the push service endpoint
   * @return the Authorization header value
   * @throws Exception if JWT signing fails
   */
  String generateVapidToken(String audience) throws Exception {
    JwtClaims claims = new JwtClaims();
    claims.setAudience(audience);
    claims.setExpirationTimeMinutesInTheFuture(VAPID_EXPIRY_HOURS * 60);
    claims.setSubject(pushProperties.vapidSubject());

    // Decode the Base64 URL-safe private key
    byte[] privateKeyBytes = Base64.getUrlDecoder().decode(
        pushProperties.vapidPrivateKey());

    // Build EC private key from raw bytes (32-byte scalar)
    ECPrivateKey ecPrivateKey = buildEcPrivateKey(privateKeyBytes);

    JsonWebSignature jws = new JsonWebSignature();
    jws.setPayload(claims.toJson());
    jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.ECDSA_USING_P256_CURVE_AND_SHA256);
    jws.setKey(ecPrivateKey);
    jws.setHeader("typ", "JWT");

    String jwt = jws.getCompactSerialization();

    return "vapid t=" + jwt + ",k=" + pushProperties.vapidPublicKey();
  }

  /**
   * Builds an EC private key from raw 32-byte scalar.
   *
   * <p>VAPID private keys are typically the raw 32-byte private scalar
   * encoded in Base64 URL-safe format. This method wraps it in a proper
   * PKCS8 structure for use with Java security APIs.
   *
   * @param rawPrivateKey the raw 32-byte EC private key scalar
   * @return the EC private key
   * @throws Exception if key construction fails
   */
  private ECPrivateKey buildEcPrivateKey(byte[] rawPrivateKey) throws Exception {
    // If the key is exactly 32 bytes, it's a raw scalar — wrap in PKCS8
    if (rawPrivateKey.length == 32) {
      // PKCS8 header for EC P-256 key
      byte[] pkcs8Header = {
          0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06,
          0x07, 0x2a, (byte) 0x86, 0x48, (byte) 0xce, 0x3d, 0x02, 0x01,
          0x06, 0x08, 0x2a, (byte) 0x86, 0x48, (byte) 0xce, 0x3d, 0x03,
          0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01,
          0x01, 0x04, 0x20
      };
      byte[] pkcs8Key = new byte[pkcs8Header.length + rawPrivateKey.length];
      System.arraycopy(pkcs8Header, 0, pkcs8Key, 0, pkcs8Header.length);
      System.arraycopy(rawPrivateKey, 0, pkcs8Key, pkcs8Header.length,
          rawPrivateKey.length);
      rawPrivateKey = pkcs8Key;
    }

    KeyFactory keyFactory = KeyFactory.getInstance("EC");
    PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(rawPrivateKey);
    return (ECPrivateKey) keyFactory.generatePrivate(keySpec);
  }

  /**
   * Returns whether the push service is configured with valid VAPID keys.
   *
   * @return true if VAPID keys are present and push is operational
   */
  public boolean isConfigured() {
    return configured;
  }
}
