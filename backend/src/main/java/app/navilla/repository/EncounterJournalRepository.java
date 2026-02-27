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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import app.navilla.entity.EncounterJournal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EncounterJournalRepository extends JpaRepository<EncounterJournal, UUID> {

  List<EncounterJournal> findByUserHashOrderByEncounterDateDesc(String userHash);

  @Query("SELECT e FROM EncounterJournal e WHERE e.userHash = :userHash "
      + "AND e.encounterDate >= :startDate AND e.encounterDate <= :endDate "
      + "ORDER BY e.encounterDate DESC")
  List<EncounterJournal> findByUserHashAndMonth(
      @Param("userHash") String userHash,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);

  @Query("SELECT FUNCTION('TO_CHAR', e.encounterDate, 'YYYY-MM') AS month, COUNT(e) "
      + "FROM EncounterJournal e "
      + "WHERE e.userHash = :userHash AND YEAR(e.encounterDate) = :year "
      + "GROUP BY FUNCTION('TO_CHAR', e.encounterDate, 'YYYY-MM') "
      + "ORDER BY month")
  List<Object[]> countByMonth(
      @Param("userHash") String userHash,
      @Param("year") int year);

  long countByUserHash(String userHash);

  List<EncounterJournal> findByUserHashAndPartnerIdOrderByEncounterDateDesc(
      String userHash, UUID partnerId);

  long countByPartnerIdAndUserHash(UUID partnerId, String userHash);

  @Query("SELECT MIN(e.encounterDate) FROM EncounterJournal e "
      + "WHERE e.partnerId = :partnerId AND e.userHash = :userHash")
  LocalDate findFirstEncounterDate(
      @Param("partnerId") UUID partnerId, @Param("userHash") String userHash);

  @Query("SELECT MAX(e.encounterDate) FROM EncounterJournal e "
      + "WHERE e.partnerId = :partnerId AND e.userHash = :userHash")
  LocalDate findMostRecentEncounterDate(
      @Param("partnerId") UUID partnerId, @Param("userHash") String userHash);

  List<EncounterJournal> findByPartnerIdAndUserHash(UUID partnerId, String userHash);

  List<EncounterJournal> findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(
      String userHash);
}
