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
 * Configuration properties for email delivery.
 *
 * <p>Values are loaded from {@code navilla.email} in application.yaml.
 * When {@code enabled} is false, all email sending is silently skipped,
 * allowing safe local development without an SMTP server.
 *
 * @param enabled  whether email sending is active
 * @param from     the sender email address
 * @param fromName the display name for the sender
 * @param replyTo  the reply-to email address
 */
@ConfigurationProperties(prefix = "navilla.email")
public record EmailProperties(
    boolean enabled,
    String from,
    String fromName,
    String replyTo
) {}
