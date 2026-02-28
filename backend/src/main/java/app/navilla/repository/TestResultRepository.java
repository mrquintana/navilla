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
import java.util.UUID;

import app.navilla.entity.ConditionType;
import app.navilla.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, UUID> {

  List<TestResult> findByVisitIdOrderByCreatedAt(UUID visitId);

  @Query("SELECT r FROM TestResult r JOIN TestVisit v ON r.visitId = v.id "
      + "WHERE v.userHash = :userHash AND r.conditionType = :conditionType "
      + "ORDER BY v.testDate DESC")
  List<TestResult> findByUserAndCondition(
      @Param("userHash") String userHash,
      @Param("conditionType") ConditionType conditionType);

  @Query("SELECT r FROM TestResult r JOIN TestVisit v ON r.visitId = v.id "
      + "WHERE v.userHash = :userHash ORDER BY v.testDate DESC")
  List<TestResult> findAllByUserHash(@Param("userHash") String userHash);
}
