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
 * Micrometer instrumentation for connection lifecycle operations.
 *
 * <p>Inject this bean into {@code ConnectionService} and call the appropriate
 * method after each state-changing operation.
 */
@Component
@RequiredArgsConstructor
public class ConnectionMetrics {

  private final MeterRegistry registry;

  /**
   * Records a connection request successfully submitted to a known recipient.
   */
  public void recordCreated() {
    registry.counter(
        Names.CONNECTION_CREATED,
        TagKeys.OUTCOME, TagValues.CREATED
    ).increment();
  }

  /**
   * Records a connection request queued because the recipient was not found.
   *
   * <p>These requests are silently dropped; the metric surfaces how often users
   * send requests to non-existent accounts.
   */
  public void recordQueuedUnknown() {
    registry.counter(
        Names.CONNECTION_CREATED,
        TagKeys.OUTCOME, TagValues.QUEUED_UNKNOWN
    ).increment();
  }

  /**
   * Records a pending connection being accepted by the recipient.
   */
  public void recordAccepted() {
    registry.counter(Names.CONNECTION_ACCEPTED).increment();
  }

  /**
   * Records a pending connection being denied by the recipient.
   */
  public void recordDenied() {
    registry.counter(Names.CONNECTION_DENIED).increment();
  }

  /**
   * Records a pending connection request cancelled by the requester.
   */
  public void recordCancelledPending() {
    registry.counter(
        Names.CONNECTION_CANCELLED,
        TagKeys.PRIOR_STATUS, TagValues.PENDING
    ).increment();
  }

  /**
   * Records a confirmed connection removed by either participant.
   */
  public void recordRemovedConfirmed() {
    registry.counter(
        Names.CONNECTION_CANCELLED,
        TagKeys.PRIOR_STATUS, TagValues.CONFIRMED
    ).increment();
  }
}
