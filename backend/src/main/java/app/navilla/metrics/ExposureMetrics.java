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

import java.util.function.Supplier;

import app.navilla.dto.ExposureResponse;
import app.navilla.metrics.NavillaMetrics.Names;
import app.navilla.metrics.NavillaMetrics.TagKeys;
import app.navilla.metrics.NavillaMetrics.TagValues;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Micrometer instrumentation for exposure snapshot operations.
 *
 * <p>Inject this bean into {@code ExposureService}. Call {@link #timeComputation}
 * to wrap the BFS computation and record its duration, and call the other
 * methods at their respective decision points.
 */
@Component
@RequiredArgsConstructor
public class ExposureMetrics {

  private final MeterRegistry registry;

  /**
   * Records a cache hit — a valid, non-expired snapshot was returned without recomputation.
   */
  public void recordCacheHit() {
    registry.counter(
        Names.EXPOSURE_SNAPSHOT,
        TagKeys.CACHE, TagValues.CACHE_HIT
    ).increment();
  }

  /**
   * Records a cache miss — no valid snapshot existed and computation was triggered.
   */
  public void recordCacheMiss() {
    registry.counter(
        Names.EXPOSURE_SNAPSHOT,
        TagKeys.CACHE, TagValues.CACHE_MISS
    ).increment();
  }

  /**
   * Wraps the exposure computation in a Timer and returns its result.
   *
   * <p>Measures wall-clock time of the BFS graph traversal plus health-status
   * aggregation. Both cache-miss and forced-recompute paths should use this wrapper.
   *
   * @param computation supplier that performs the computation and returns the response
   * @return the computed {@link ExposureResponse}
   */
  public ExposureResponse timeComputation(Supplier<ExposureResponse> computation) {
    return Timer.builder(Names.EXPOSURE_COMPUTATION_DURATION)
        .description("Time to compute an exposure snapshot (BFS + health status aggregation)")
        .register(registry)
        .record(computation);
  }

  /**
   * Records the number of nodes in the connection graph for this computation.
   *
   * <p>Tracked as a {@link DistributionSummary} so p50/p95/p99 are available in Grafana.
   *
   * @param nodeCount total number of reachable nodes in the graph
   */
  public void recordGraphNodes(int nodeCount) {
    DistributionSummary.builder(Names.EXPOSURE_GRAPH_NODES)
        .description("Number of nodes reachable in the connection graph at computation time")
        .register(registry)
        .record(nodeCount);
  }

  /**
   * Records that a user had fewer than the minimum required connections
   * and received a threshold-violation response instead of exposure data.
   */
  public void recordInsufficientConnections() {
    registry.counter(Names.EXPOSURE_INSUFFICIENT_CONNECTIONS).increment();
  }
}
