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

/**
 * Central registry of Micrometer metric names, tag keys, and tag values for Navilla.
 *
 * <p>All instrumentation code must reference constants from this class rather than
 * using inline string literals. This ensures metric names and tag keys are consistent
 * across the codebase and easy to refactor.
 *
 * <p>Naming convention: {@code navilla.<domain>.<action>} using dot-separated lowercase.
 * Grafana Cloud will show these as {@code navilla_domain_action_total} after OTLP ingestion.
 */
public final class NavillaMetrics {

  private NavillaMetrics() {}

  /** Metric names, organised by domain. */
  public static final class Names {

    private Names() {}

    // ── Health status ────────────────────────────────────────────────────────

    /** Health status record created or updated. */
    public static final String HEALTH_STATUS_REPORTED = "navilla.health.status.reported";

    /** Health status record marked as cleared. */
    public static final String HEALTH_STATUS_CLEARED = "navilla.health.status.cleared";

    /** Cleared health status record reactivated. */
    public static final String HEALTH_STATUS_ACTIVATED = "navilla.health.status.activated";

    /** Health status record deleted. */
    public static final String HEALTH_STATUS_DELETED = "navilla.health.status.deleted";

    // ── Connections ──────────────────────────────────────────────────────────

    /** Connection request submitted. */
    public static final String CONNECTION_CREATED = "navilla.connection.created";

    /** Pending connection request accepted. */
    public static final String CONNECTION_ACCEPTED = "navilla.connection.accepted";

    /** Pending connection request denied. */
    public static final String CONNECTION_DENIED = "navilla.connection.denied";

    /** Connection cancelled or removed. */
    public static final String CONNECTION_CANCELLED = "navilla.connection.cancelled";

    // ── Exposure ─────────────────────────────────────────────────────────────

    /** Exposure snapshot cache request (hit or miss). */
    public static final String EXPOSURE_SNAPSHOT = "navilla.exposure.snapshot";

    /** Time taken to compute an exposure snapshot (Timer). */
    public static final String EXPOSURE_COMPUTATION_DURATION = "navilla.exposure.computation.duration";

    /** Number of nodes in the connection graph at computation time (DistributionSummary). */
    public static final String EXPOSURE_GRAPH_NODES = "navilla.exposure.graph.nodes";

    /** User had fewer than the minimum required connections. */
    public static final String EXPOSURE_INSUFFICIENT_CONNECTIONS =
        "navilla.exposure.insufficient.connections";

    // ── Journal ──────────────────────────────────────────────────────────────

    /** Journal entry created. */
    public static final String JOURNAL_ENTRY_CREATED = "navilla.journal.entry.created";

    /** Journal entry updated. */
    public static final String JOURNAL_ENTRY_UPDATED = "navilla.journal.entry.updated";

    /** Journal entry deleted. */
    public static final String JOURNAL_ENTRY_DELETED = "navilla.journal.entry.deleted";

    /** Custom field templates saved. */
    public static final String JOURNAL_TEMPLATES_SAVED = "navilla.journal.templates.saved";

    /** Journal partner created. */
    public static final String JOURNAL_PARTNER_CREATED = "navilla.journal.partner.created";

    /** Journal partner updated. */
    public static final String JOURNAL_PARTNER_UPDATED = "navilla.journal.partner.updated";

    /** Journal partner deleted. */
    public static final String JOURNAL_PARTNER_DELETED = "navilla.journal.partner.deleted";

    /** Freeform alias promoted to journal partner. */
    public static final String JOURNAL_PARTNER_PROMOTED = "navilla.journal.partner.promoted";

    // ── Notifications ────────────────────────────────────────────────────────

    /** Notification created. */
    public static final String NOTIFICATION_CREATED = "navilla.notification.created";

    /** Notification marked as read. */
    public static final String NOTIFICATION_READ = "navilla.notification.read";

    /** Notification creation failed (encryption or persistence error). */
    public static final String NOTIFICATION_CREATION_FAILED = "navilla.notification.creation.failed";
  }

  /** Tag keys used across metrics. Values come from {@link TagValues} or domain enums. */
  public static final class TagKeys {

    private TagKeys() {}

    /** Condition type (e.g. {@code hiv}, {@code chlamydia}). */
    public static final String CONDITION = "condition";

    /** Health status value (e.g. {@code positive}, {@code negative}). */
    public static final String STATUS = "status";

    /** Outcome of an operation (e.g. {@code created}, {@code updated}). */
    public static final String OUTCOME = "outcome";

    /** Cache result for exposure snapshots (e.g. {@code hit}, {@code miss}). */
    public static final String CACHE = "cache";

    /** Notification or event type. */
    public static final String TYPE = "type";

    /**
     * The status of a connection before it was cancelled
     * (e.g. {@code pending}, {@code confirmed}).
     */
    public static final String PRIOR_STATUS = "prior_status";
  }

  /** Reusable tag values. Enum-derived values are lowercase-formatted at call sites. */
  public static final class TagValues {

    private TagValues() {}

    // Outcomes
    /** Record was newly created. */
    public static final String CREATED = "created";

    /** Existing record was updated. */
    public static final String UPDATED = "updated";

    /** Request queued because the recipient does not exist yet. */
    public static final String QUEUED_UNKNOWN = "queued_unknown_recipient";

    // Cache
    /** Valid cached snapshot was returned. */
    public static final String CACHE_HIT = "hit";

    /** No valid snapshot found; computation required. */
    public static final String CACHE_MISS = "miss";

    // Prior status for connection cancellation
    /** Connection was in PENDING state when cancelled. */
    public static final String PENDING = "pending";

    /** Connection was in CONFIRMED state when removed. */
    public static final String CONFIRMED = "confirmed";
  }
}
