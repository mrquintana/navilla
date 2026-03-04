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
 * Response DTO for a condition catalog entry.
 *
 * <p>Exposes the public fields of a condition for frontend consumption,
 * including bilingual display names and descriptions.
 *
 * @param code          unique condition code (e.g. "HIV", "CHLAMYDIA")
 * @param displayName   English display name
 * @param displayNameEs Spanish display name
 * @param description   English description
 * @param descriptionEs Spanish description
 * @param icon          optional icon identifier
 * @param displayOrder  sort order for UI rendering
 * @author Navilla Team
 * @since 2026-03-04
 */
public record ConditionCatalogResponse(
    String code,
    String displayName,
    String displayNameEs,
    String description,
    String descriptionEs,
    String icon,
    int displayOrder
) {}
