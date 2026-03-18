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

package app.navilla.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.VerificationCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository for verification card persistence operations.
 */
public interface VerificationCardRepository extends JpaRepository<VerificationCard, UUID> {

  long countByUserHash(String userHash);

  List<VerificationCard> findByUserHashOrderByCreatedAtDesc(String userHash);

  Optional<VerificationCard> findByShareToken(String shareToken);

  Optional<VerificationCard> findByIdAndUserHash(UUID id, String userHash);

  /**
   * Atomically increments the view count if the card has not reached its view limit.
   *
   * @param id the card ID
   * @return 1 if the increment succeeded, 0 if the view limit was reached
   */
  @Modifying
  @Query("UPDATE VerificationCard v SET v.currentViews = v.currentViews + 1 "
      + "WHERE v.id = :id AND (v.maxViews IS NULL OR v.currentViews < v.maxViews)")
  int incrementViewsIfAllowed(@Param("id") UUID id);
}
