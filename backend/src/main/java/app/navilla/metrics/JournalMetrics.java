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
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Micrometer instrumentation for encounter journal operations.
 *
 * <p>Inject this bean into {@code EncounterJournalService} and call the appropriate
 * method after each state-changing operation.
 */
@Component
@RequiredArgsConstructor
public class JournalMetrics {

  private final MeterRegistry registry;

  /** Records a new journal entry being created. */
  public void recordEntryCreated() {
    registry.counter(Names.JOURNAL_ENTRY_CREATED).increment();
  }

  /** Records a journal entry being updated. */
  public void recordEntryUpdated() {
    registry.counter(Names.JOURNAL_ENTRY_UPDATED).increment();
  }

  /** Records a journal entry being deleted. */
  public void recordEntryDeleted() {
    registry.counter(Names.JOURNAL_ENTRY_DELETED).increment();
  }

  /**
   * Records custom field templates being saved.
   *
   * @param count the number of templates saved (0-3)
   */
  public void recordTemplatesSaved(int count) {
    registry.counter(Names.JOURNAL_TEMPLATES_SAVED, "count", String.valueOf(count)).increment();
  }
}
