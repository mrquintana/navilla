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

package app.navilla.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for Web Push notification delivery (VAPID / RFC 8292).
 *
 * <p>Values are loaded from {@code navilla.push} in application.yaml.
 * When {@code vapidPublicKey} is blank, push sending is silently skipped,
 * allowing safe local development without VAPID keys.
 *
 * @param vapidPublicKey  the VAPID public key (Base64 URL-safe encoded)
 * @param vapidPrivateKey the VAPID private key (Base64 URL-safe encoded)
 * @param vapidSubject    the VAPID subject (mailto: or https: URL identifying the sender)
 */
@ConfigurationProperties(prefix = "navilla.push")
public record PushProperties(
    String vapidPublicKey,
    String vapidPrivateKey,
    String vapidSubject
) {}
