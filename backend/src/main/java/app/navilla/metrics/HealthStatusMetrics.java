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

import app.navilla.metrics.NavillaMetrics.Names;
import app.navilla.metrics.NavillaMetrics.TagKeys;
import app.navilla.metrics.NavillaMetrics.TagValues;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Micrometer instrumentation for health status operations.
 *
 * <p>Inject this bean into {@code HealthStatusService} and call the appropriate
 * method after each state-changing operation.
 */
@Component
@RequiredArgsConstructor
public class HealthStatusMetrics {

  private final MeterRegistry registry;

  /**
   * Records a health status report (create or update).
   *
   * @param condition lowercase condition type name (e.g. {@code hiv})
   * @param status lowercase status value (e.g. {@code positive})
   * @param isUpdate {@code true} when an existing record was updated, {@code false} when created
   */
  public void recordReported(String condition, String status, boolean isUpdate) {
    registry.counter(
        Names.HEALTH_STATUS_REPORTED,
        TagKeys.CONDITION, condition,
        TagKeys.STATUS, status,
        TagKeys.OUTCOME, isUpdate ? TagValues.UPDATED : TagValues.CREATED
    ).increment();
  }

  /**
   * Records a health status being marked as cleared.
   *
   * @param condition lowercase condition type name
   */
  public void recordCleared(String condition) {
    registry.counter(
        Names.HEALTH_STATUS_CLEARED,
        TagKeys.CONDITION, condition
    ).increment();
  }

  /**
   * Records a cleared health status being reactivated.
   *
   * @param condition lowercase condition type name
   */
  public void recordActivated(String condition) {
    registry.counter(
        Names.HEALTH_STATUS_ACTIVATED,
        TagKeys.CONDITION, condition
    ).increment();
  }

  /**
   * Records a health status record being deleted.
   *
   * @param condition lowercase condition type name
   */
  public void recordDeleted(String condition) {
    registry.counter(
        Names.HEALTH_STATUS_DELETED,
        TagKeys.CONDITION, condition
    ).increment();
  }
}
