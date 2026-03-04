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

package app.navilla.dto;

/**
 * Payload DTO for web push notification content.
 *
 * <p>Represents the JSON body sent inside a push notification message.
 * The service worker on the client reads these fields to display
 * the notification to the user.
 *
 * @param title the notification title (required)
 * @param body  the notification body text (required)
 * @param url   the URL to open when the notification is clicked (optional)
 * @param icon  the notification icon URL (defaults to "/icons/icon-192.png")
 * @param tag   the notification tag for grouping/replacing (optional)
 * @author Navilla Team
 * @since 2026-03-03
 */
public record PushPayload(
    String title,
    String body,
    String url,
    String icon,
    String tag
) {

  /**
   * Creates a PushPayload with the default icon.
   *
   * @param title the notification title
   * @param body  the notification body text
   * @param url   the URL to open on click
   * @param tag   the notification tag
   * @return a new PushPayload with the default icon path
   */
  public static PushPayload withDefaults(String title, String body, String url, String tag) {
    return new PushPayload(title, body, url, "/icons/icon-192.png", tag);
  }
}
