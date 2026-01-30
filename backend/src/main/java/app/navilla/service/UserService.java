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
import app.navilla.entity.User;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user-related operations.
 *
 * <p>Handles user profile retrieval, updates, and account management.
 * All sensitive data is encrypted/decrypted through this service.
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
   * Gets the current user's profile by their Supabase user ID.
   *
   * <p>The user ID is extracted from the JWT token and hashed to find
   * the user in the database.
   *
   * @param userId the Supabase user ID from JWT
   * @return the user's profile with decrypted data
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional(readOnly = true)
  public UserResponse getCurrentUser(String userId) {
    String userHash = encryptionService.hashUserId(userId);
    User user = userRepository.findByEmailHash(userHash)
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
   * Updates the current user's profile.
   *
   * @param userId the Supabase user ID from JWT
   * @param request the profile update request
   * @return the updated user profile
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional
  public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
    String userHash = encryptionService.hashUserId(userId);
    User user = userRepository.findByEmailHash(userHash)
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
    log.info("Updated profile for user hash: {}", userHash.substring(0, 8) + "...");

    return toUserResponse(savedUser);
  }

  /**
   * Creates a new user account (called during Supabase auth sync).
   *
   * @param userId the Supabase user ID
   * @param email the user's email address
   * @return the created user's profile
   */
  @Transactional
  public UserResponse createUser(String userId, String email) {
    String emailHash = encryptionService.hashEmail(email);

    if (userRepository.existsByEmailHash(emailHash)) {
      log.warn("Attempted to create duplicate user for email hash: {}...",
          emailHash.substring(0, 8));
      // Return existing user instead of throwing
      User existingUser = userRepository.findByEmailHash(emailHash).orElseThrow();
      return toUserResponse(existingUser);
    }

    User user = User.builder()
        .emailHash(emailHash)
        .emailEncrypted(encryptionService.encryptToBytes(email))
        .verified(false)
        .build();

    User savedUser = userRepository.save(user);
    log.info("Created new user with hash: {}...", emailHash.substring(0, 8));

    return toUserResponse(savedUser);
  }

  /**
   * Deletes a user account.
   *
   * @param userId the Supabase user ID from JWT
   * @throws ResourceNotFoundException if user not found
   */
  @Transactional
  public void deleteUser(String userId) {
    String userHash = encryptionService.hashUserId(userId);
    User user = userRepository.findByEmailHash(userHash)
        .orElseThrow(() -> new ResourceNotFoundException("user.error.notFound"));

    userRepository.delete(user);
    log.info("Deleted user with hash: {}...", userHash.substring(0, 8));
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
