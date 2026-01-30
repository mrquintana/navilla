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

import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for User entity operations.
 *
 * <p>Provides database access for user accounts. All email lookups
 * should use the hashed email field, never plaintext.
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

  /**
   * Finds a user by their hashed email.
   *
   * <p>The email hash should be generated using
   * {@link app.navilla.security.EncryptionService#hashEmail(String)}.
   *
   * @param emailHash the SHA-256 hash of the email (with pepper)
   * @return the user if found
   */
  Optional<User> findByEmailHash(String emailHash);

  /**
   * Checks if a user exists with the given email hash.
   *
   * @param emailHash the SHA-256 hash of the email (with pepper)
   * @return true if a user exists with this email hash
   */
  boolean existsByEmailHash(String emailHash);
}
