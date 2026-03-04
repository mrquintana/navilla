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

import app.navilla.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for {@link PushSubscription} entities.
 *
 * <p>Provides CRUD operations and user-scoped queries for web push
 * notification subscriptions.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

  /**
   * Finds all push subscriptions for a given user hash.
   *
   * @param userHash the hashed user identifier
   * @return list of push subscriptions
   */
  List<PushSubscription> findByUserHash(String userHash);

  /**
   * Deletes a push subscription by user hash and subscription id.
   *
   * @param userHash the hashed user identifier
   * @param id the subscription id
   */
  void deleteByUserHashAndId(String userHash, UUID id);
}
