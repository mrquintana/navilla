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

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import app.navilla.entity.ConnectionPhoneEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for ConnectionPhoneEntry entity operations.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Repository
public interface ConnectionPhoneEntryRepository extends JpaRepository<ConnectionPhoneEntry, UUID> {

  /**
   * Finds unmatched entries for a given phone hash submitted by a different user.
   *
   * @param phoneHash the phone hash to look for
   * @param userHash  the current user's hash (to exclude their own entries)
   * @return list of unmatched entries from other users for this phone hash
   */
  List<ConnectionPhoneEntry> findByPhoneHashAndMatchedFalseAndUserHashNot(
      String phoneHash, String userHash);

  /**
   * Finds unmatched entries for a given user and phone hash.
   *
   * @param userHash  the user's hash
   * @param phoneHash the phone hash
   * @return list of unmatched entries
   */
  List<ConnectionPhoneEntry> findByUserHashAndPhoneHashAndMatchedFalse(
      String userHash, String phoneHash);

  /**
   * Finds all unmatched phone entries.
   *
   * @return list of all unmatched entries
   */
  List<ConnectionPhoneEntry> findByMatchedFalse();

  /**
   * Counts the number of entries a user has created since a given timestamp.
   * Used for rate limiting.
   *
   * @param userHash  the user's hash
   * @param since     the start of the rate limit window
   * @return count of entries created since the given time
   */
  @Query("SELECT COUNT(e) FROM ConnectionPhoneEntry e "
      + "WHERE e.userHash = :userHash AND e.createdAt >= :since")
  long countEntriesThisWeek(
      @Param("userHash") String userHash,
      @Param("since") OffsetDateTime since);
}
