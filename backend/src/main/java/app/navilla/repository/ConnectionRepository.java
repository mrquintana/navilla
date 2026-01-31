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

import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Connection entity operations.
 *
 * <p>Provides database access for connection requests and relationships.
 * All lookups use hashed user identifiers for privacy.
 *
 * @author Navilla Team
 * @since 2026-01-31
 */
@Repository
public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

  /**
   * Finds all connections where the user is either party (requester or recipient).
   *
   * @param userHash the user's hashed identifier
   * @return list of connections involving this user
   */
  @Query("SELECT c FROM Connection c WHERE c.requesterHash = :userHash OR c.recipientHash = :userHash")
  List<Connection> findAllByUserHash(@Param("userHash") String userHash);

  /**
   * Finds all confirmed connections for a user.
   *
   * @param userHash the user's hashed identifier
   * @return list of confirmed connections
   */
  @Query("SELECT c FROM Connection c WHERE (c.requesterHash = :userHash OR c.recipientHash = :userHash) "
      + "AND c.status = 'CONFIRMED'")
  List<Connection> findConfirmedByUserHash(@Param("userHash") String userHash);

  /**
   * Finds pending connection requests received by a user.
   *
   * @param recipientHash the recipient's hashed identifier
   * @param status the connection status to filter by
   * @return list of incoming requests with the given status
   */
  List<Connection> findByRecipientHashAndStatus(String recipientHash, ConnectionStatus status);

  /**
   * Finds pending connection requests sent by a user.
   *
   * @param requesterHash the requester's hashed identifier
   * @param status the connection status to filter by
   * @return list of outgoing requests with the given status
   */
  List<Connection> findByRequesterHashAndStatus(String requesterHash, ConnectionStatus status);

  /**
   * Finds a connection between two specific users (in either direction).
   *
   * @param userHashA first user's hashed identifier
   * @param userHashB second user's hashed identifier
   * @return the connection if exists
   */
  @Query("SELECT c FROM Connection c WHERE "
      + "(c.requesterHash = :userHashA AND c.recipientHash = :userHashB) OR "
      + "(c.requesterHash = :userHashB AND c.recipientHash = :userHashA)")
  Optional<Connection> findBetweenUsers(
      @Param("userHashA") String userHashA,
      @Param("userHashB") String userHashB);

  /**
   * Checks if a connection exists between two users (in either direction).
   *
   * @param userHashA first user's hashed identifier
   * @param userHashB second user's hashed identifier
   * @return true if any connection exists
   */
  @Query("SELECT COUNT(c) > 0 FROM Connection c WHERE "
      + "(c.requesterHash = :userHashA AND c.recipientHash = :userHashB) OR "
      + "(c.requesterHash = :userHashB AND c.recipientHash = :userHashA)")
  boolean existsBetweenUsers(
      @Param("userHashA") String userHashA,
      @Param("userHashB") String userHashB);

  /**
   * Counts confirmed connections for a user.
   *
   * @param userHash the user's hashed identifier
   * @return count of confirmed connections
   */
  @Query("SELECT COUNT(c) FROM Connection c WHERE "
      + "(c.requesterHash = :userHash OR c.recipientHash = :userHash) AND c.status = 'CONFIRMED'")
  long countConfirmedByUserHash(@Param("userHash") String userHash);

  /**
   * Counts pending incoming requests for a user.
   *
   * @param recipientHash the recipient's hashed identifier
   * @param status the connection status to filter by
   * @return count of incoming requests with the given status
   */
  long countByRecipientHashAndStatus(String recipientHash, ConnectionStatus status);
}
