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

package app.navilla.service;

import java.util.UUID;

import app.navilla.dto.UpdateProfileRequest;
import app.navilla.dto.UserResponse;
import app.navilla.entity.ProfileVisibility;
import app.navilla.entity.User;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user-related operations.
 *
 * <p>Handles user profile retrieval, updates, and account management.
 * All sensitive data is encrypted/decrypted through this service.
 *
 * <p>Implements lazy sync: if a user exists in Supabase Auth but not in
 * our database, they are automatically created on first API access.
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final EncryptionService encryptionService;

  /**
   * Gets or creates the current user's profile from JWT token.
   *
   * <p>Implements lazy sync: if the user doesn't exist in our database,
   * they are automatically created using information from the JWT.
   *
   * @param jwt the JWT token from Supabase Auth
   * @return the user's profile with decrypted data
   */
  @Transactional
  public UserResponse getOrCreateCurrentUser(Jwt jwt) {
    UUID supabaseId = UUID.fromString(jwt.getSubject());
    String email = jwt.getClaimAsString("email");

    return userRepository.findBySupabaseId(supabaseId)
        .map(this::toUserResponse)
        .orElseGet(() -> createUserFromJwt(supabaseId, email));
  }

  /**
   * Gets the current user's profile by their Supabase ID.
   *
   * <p>Unlike {@link #getOrCreateCurrentUser(Jwt)}, this method does not
   * create the user if they don't exist.
   *
   * @param supabaseId the Supabase Auth user UUID
   * @return the user's profile
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional(readOnly = true)
  public UserResponse getUserBySupabaseId(UUID supabaseId) {
    User user = userRepository.findBySupabaseId(supabaseId)
        .orElseThrow(() -> new ResourceNotFoundException("user.error.notFound"));
    return toUserResponse(user);
  }

  /**
   * Gets a user by their database ID.
   *
   * @param id the user's UUID
   * @return the user's profile
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional(readOnly = true)
  public UserResponse getUserById(UUID id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("user.error.notFound"));
    return toUserResponse(user);
  }

  /**
   * Finds a user by their email hash (for connection requests).
   *
   * @param email the plaintext email to look up
   * @return the user if found
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional(readOnly = true)
  public UserResponse getUserByEmail(String email) {
    String emailHash = encryptionService.hashEmail(email);
    User user = userRepository.findByEmailHash(emailHash)
        .orElseThrow(() -> new ResourceNotFoundException("user.error.notFound"));
    return toUserResponse(user);
  }

  /**
   * Updates the current authenticated user's profile.
   *
   * @param jwt the JWT token from Supabase Auth
   * @param request the profile update request
   * @return the updated user profile
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional
  public UserResponse updateProfile(Jwt jwt, UpdateProfileRequest request) {
    UUID supabaseId = UUID.fromString(jwt.getSubject());
    User user = userRepository.findBySupabaseId(supabaseId)
        .orElseThrow(() -> new ResourceNotFoundException("user.error.notFound"));

    if (request.displayName() != null) {
      if (request.displayName().isBlank()) {
        user.setDisplayNameEncrypted(null);
      } else {
        user.setDisplayNameEncrypted(
            encryptionService.encryptToBytes(request.displayName().trim()));
      }
    }

    User savedUser = userRepository.save(user);
    log.info("Updated profile for supabase_id: {}", supabaseId);

    return toUserResponse(savedUser);
  }

  /**
   * Deletes a user account.
   *
   * @param jwt the JWT token from Supabase Auth
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional
  public void deleteUser(Jwt jwt) {
    UUID supabaseId = UUID.fromString(jwt.getSubject());
    User user = userRepository.findBySupabaseId(supabaseId)
        .orElseThrow(() -> new ResourceNotFoundException("user.error.notFound"));

    userRepository.delete(user);
    log.info("Deleted user with supabase_id: {}", supabaseId);
  }

  /**
   * Creates a new user from JWT claims (lazy sync).
   */
  private UserResponse createUserFromJwt(UUID supabaseId, String email) {
    if (email == null || email.isBlank()) {
      throw new IllegalStateException("JWT does not contain email claim");
    }

    String emailHash = encryptionService.hashEmail(email);

    // Check if user exists by email (edge case: same email, different Supabase ID)
    if (userRepository.existsByEmailHash(emailHash)) {
      log.warn("User exists by email but not by Supabase ID. Linking accounts.");
      User existingUser = userRepository.findByEmailHash(emailHash).orElseThrow();
      existingUser.setSupabaseId(supabaseId);
      return toUserResponse(userRepository.save(existingUser));
    }

    User user = User.builder()
        .supabaseId(supabaseId)
        .emailHash(emailHash)
        .emailEncrypted(encryptionService.encryptToBytes(email))
        .verified(false)
        .profileVisibility(ProfileVisibility.PRIVATE)
        .displayNamePublic(false)
        .searchableByEmail(false)
        .build();

    User savedUser = userRepository.save(user);
    log.info("Created new user via lazy sync. supabase_id: {}, email_hash: {}...",
        supabaseId, emailHash.substring(0, 8));

    return toUserResponse(savedUser);
  }

  /**
   * Converts a User entity to a UserResponse DTO.
   */
  private UserResponse toUserResponse(User user) {
    String email = encryptionService.decryptFromBytes(user.getEmailEncrypted());
    String displayName = user.getDisplayNameEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getDisplayNameEncrypted())
        : null;

    return new UserResponse(
        user.getId(),
        email,
        displayName,
        user.getVerified(),
        user.getCreatedAt()
    );
  }
}
