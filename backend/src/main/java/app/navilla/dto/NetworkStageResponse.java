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
 * Response DTO for a network constellation stage.
 *
 * <p>Exposes the public fields of a network stage for frontend consumption,
 * including bilingual display names and node count thresholds.
 *
 * @param code          unique stage code (e.g. "EMPTY_SKY", "BINARY_STAR")
 * @param displayName   English display name
 * @param displayNameEs Spanish display name
 * @param minNodes      minimum node count for this stage (inclusive)
 * @param maxNodes      maximum node count for this stage (inclusive), null for unlimited
 * @param description   English description
 * @param descriptionEs Spanish description
 * @author Navilla Team
 * @since 2026-03-04
 */
public record NetworkStageResponse(
    String code,
    String displayName,
    String displayNameEs,
    int minNodes,
    Integer maxNodes,
    String description,
    String descriptionEs
) {}
