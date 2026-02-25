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

package app.navilla.metrics;

import app.navilla.entity.NotificationType;
import app.navilla.metrics.NavillaMetrics.Names;
import app.navilla.metrics.NavillaMetrics.TagKeys;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Micrometer instrumentation for notification operations.
 *
 * <p>Inject this bean into {@code NotificationService} and call the appropriate
 * method after each operation.
 */
@Component
@RequiredArgsConstructor
public class NotificationMetrics {

  private final MeterRegistry registry;

  /**
   * Records a notification successfully persisted.
   *
   * @param type the notification type
   */
  public void recordCreated(NotificationType type) {
    registry.counter(
        Names.NOTIFICATION_CREATED,
        TagKeys.TYPE, type.name().toLowerCase()
    ).increment();
  }

  /**
   * Records a notification marked as read.
   */
  public void recordRead() {
    registry.counter(Names.NOTIFICATION_READ).increment();
  }

  /**
   * Records a notification that failed to be persisted (encryption or DB error).
   *
   * @param type the notification type that failed
   */
  public void recordCreationFailed(NotificationType type) {
    registry.counter(
        Names.NOTIFICATION_CREATION_FAILED,
        TagKeys.TYPE, type.name().toLowerCase()
    ).increment();
  }
}
