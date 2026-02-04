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

import java.util.Map;
import java.util.UUID;

import app.navilla.dto.UpdateProfileRequest;
import app.navilla.dto.UserResponse;
import app.navilla.dto.UserSearchResult;
import app.navilla.entity.ProfileVisibility;
import app.navilla.entity.User;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

  @Value("${navilla.storage.public-base-url}")
  private String storagePublicBaseUrl;

  @Value("${navilla.storage.avatar-bucket}")
  private String avatarBucket;

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
    Map<String, Object> userMetadata = jwt.getClaimAsMap("user_metadata");

    return userRepository.findBySupabaseId(supabaseId)
        .map(this::toUserResponse)
        .orElseGet(() -> toUserResponse(createUserEntityFromJwt(supabaseId, email, userMetadata)));
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
   * Searches for a public user by email or username.
   *
   * @param query email or username
   * @return public profile info if visible
   */
  @Transactional(readOnly = true)
  public UserSearchResult searchPublicUser(String query) {
    if (query == null || query.isBlank()) {
      return null;
    }
    String trimmed = query.trim();
    User user;
    if (trimmed.contains("@")) {
      String emailHash = encryptionService.hashEmail(trimmed);
      user = userRepository.findByEmailHash(emailHash).orElse(null);
      if (user == null || user.getProfileVisibility() != ProfileVisibility.PUBLIC
          || !Boolean.TRUE.equals(user.getSearchableByEmail())) {
        return null;
      }
    } else {
      String usernameHash = encryptionService.hashUsername(trimmed);
      user = userRepository.findByUsernameHash(usernameHash).orElse(null);
      if (user == null || user.getProfileVisibility() != ProfileVisibility.PUBLIC) {
        return null;
      }
    }

    String displayName = null;
    if (Boolean.TRUE.equals(user.getDisplayNamePublic()) && user.getDisplayNameEncrypted() != null) {
      displayName = encryptionService.decryptFromBytes(user.getDisplayNameEncrypted());
    }

    return new UserSearchResult(
        user.getUsername(),
        displayName,
        buildPublicUrl(user.getAvatarThumbKey())
    );
  }

  /**
   * Updates the current authenticated user's profile.
   *
   * @param jwt the JWT token from Supabase Auth
   * @param request the profile update request
   * @return the updated user profile
   * @throws ResourceNotFoundException if user cannot be created
   */
  @Transactional
  public UserResponse updateProfile(Jwt jwt, UpdateProfileRequest request) {
    UUID supabaseId = UUID.fromString(jwt.getSubject());
    String email = jwt.getClaimAsString("email");
    Map<String, Object> userMetadata = jwt.getClaimAsMap("user_metadata");
    User user = userRepository.findBySupabaseId(supabaseId)
        .orElseGet(() -> createUserEntityFromJwt(supabaseId, email, userMetadata));

    if (request.displayName() != null) {
      if (request.displayName().isBlank()) {
        user.setDisplayNameEncrypted(null);
      } else {
        user.setDisplayNameEncrypted(
            encryptionService.encryptToBytes(request.displayName().trim()));
      }
    }

    if (request.fullName() != null) {
      if (request.fullName().isBlank()) {
        user.setFullNameEncrypted(null);
      } else {
        user.setFullNameEncrypted(
            encryptionService.encryptToBytes(request.fullName().trim()));
      }
    }

    if (request.username() != null) {
      if (request.username().isBlank()) {
        user.setUsername(null);
        user.setUsernameHash(null);
      } else {
        String normalized = request.username().trim().toLowerCase();
        if (!normalized.equalsIgnoreCase(user.getUsername())
            && userRepository.existsByUsernameIgnoreCase(normalized)) {
          throw new IllegalStateException("user.error.usernameTaken");
        }
        user.setUsername(normalized);
        user.setUsernameHash(encryptionService.hashUsername(normalized));
      }
    }

    if (request.sex() != null) {
      user.setSex(request.sex().isBlank() ? null : request.sex().trim());
    }

    if (request.dateOfBirth() != null) {
      if (request.dateOfBirth().isBlank()) {
        user.setDobEncrypted(null);
      } else {
        user.setDobEncrypted(encryptionService.encryptToBytes(request.dateOfBirth().trim()));
      }
    }

    if (request.showAge() != null) {
      user.setShowAge(request.showAge());
    }

    if (request.country() != null) {
      user.setCountry(request.country().isBlank() ? null : request.country().trim().toUpperCase());
    }

    if (request.location() != null) {
      if (request.location().isBlank()) {
        user.setLocationEncrypted(null);
      } else {
        user.setLocationEncrypted(
            encryptionService.encryptToBytes(request.location().trim()));
      }
    }

    if (request.profileVisibility() != null) {
      try {
        ProfileVisibility visibility = ProfileVisibility.valueOf(
            request.profileVisibility().trim().toUpperCase());
        user.setProfileVisibility(visibility);
        if (visibility != ProfileVisibility.PUBLIC) {
          user.setSearchableByEmail(false);
          user.setDisplayNamePublic(false);
        }
      } catch (IllegalArgumentException ex) {
        throw new IllegalArgumentException("user.error.invalidVisibility");
      }
    }

    if (request.displayNamePublic() != null) {
      user.setDisplayNamePublic(request.displayNamePublic());
    }

    if (request.searchableByEmail() != null) {
      user.setSearchableByEmail(request.searchableByEmail());
    }

    if (request.avatarKey() != null) {
      user.setAvatarKey(request.avatarKey().isBlank() ? null : request.avatarKey().trim());
    }

    if (request.avatarThumbKey() != null) {
      user.setAvatarThumbKey(request.avatarThumbKey().isBlank() ? null : request.avatarThumbKey().trim());
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
  private User createUserEntityFromJwt(UUID supabaseId, String email,
      Map<String, Object> userMetadata) {
    if (email == null || email.isBlank()) {
      throw new IllegalStateException("JWT does not contain email claim");
    }

    String emailHash = encryptionService.hashEmail(email);

    // Check if user exists by email (edge case: same email, different Supabase ID)
    if (userRepository.existsByEmailHash(emailHash)) {
      log.warn("User exists by email but not by Supabase ID. Linking accounts.");
      User existingUser = userRepository.findByEmailHash(emailHash).orElseThrow();
      existingUser.setSupabaseId(supabaseId);
      return userRepository.save(existingUser);
    }

    User user = User.builder()
        .supabaseId(supabaseId)
        .emailHash(emailHash)
        .emailEncrypted(encryptionService.encryptToBytes(email))
        .verified(false)
        .profileVisibility(ProfileVisibility.PRIVATE)
        .displayNamePublic(false)
        .searchableByEmail(false)
        .showAge(false)
        .build();

    applyUserMetadata(user, userMetadata);

    User savedUser = userRepository.save(user);
    log.info("Created new user via lazy sync. supabase_id: {}, email_hash: {}...",
        supabaseId, emailHash.substring(0, 8));

    return savedUser;
  }

  /**
   * Applies Supabase user metadata to a new user entity.
   *
   * @param user the user entity to update
   * @param userMetadata the metadata map from Supabase JWT
   */
  private void applyUserMetadata(User user, Map<String, Object> userMetadata) {
    if (userMetadata == null || userMetadata.isEmpty()) {
      return;
    }

    String fullName = readMetadata(userMetadata, "fullName", "full_name");
    String username = readMetadata(userMetadata, "username", null);
    String dateOfBirth = readMetadata(userMetadata, "dateOfBirth", "date_of_birth");
    String sex = readMetadata(userMetadata, "sex", null);
    String country = readMetadata(userMetadata, "country", null);
    String location = readMetadata(userMetadata, "location", null);

    if (fullName != null && !fullName.isBlank()) {
      user.setFullNameEncrypted(encryptionService.encryptToBytes(fullName.trim()));
      user.setDisplayNameEncrypted(encryptionService.encryptToBytes(fullName.trim()));
    } else if (username != null && !username.isBlank()) {
      user.setDisplayNameEncrypted(encryptionService.encryptToBytes(username.trim()));
    }

    if (username != null && !username.isBlank()) {
      String normalized = username.trim().toLowerCase();
      if (!userRepository.existsByUsernameIgnoreCase(normalized)) {
        user.setUsername(normalized);
        user.setUsernameHash(encryptionService.hashUsername(normalized));
      } else {
        log.warn("Username from metadata already taken: {}", normalized);
      }
    }

    if (sex != null && !sex.isBlank()) {
      user.setSex(sex.trim());
    }

    if (dateOfBirth != null && !dateOfBirth.isBlank()) {
      user.setDobEncrypted(encryptionService.encryptToBytes(dateOfBirth.trim()));
    }

    if (country != null && !country.isBlank()) {
      user.setCountry(country.trim().toUpperCase());
    }

    if (location != null && !location.isBlank()) {
      user.setLocationEncrypted(encryptionService.encryptToBytes(location.trim()));
    }
  }

  /**
   * Reads a string value from metadata with optional fallback key.
   *
   * @param metadata metadata map
   * @param primaryKey primary key to read
   * @param fallbackKey fallback key to read
   * @return string value or null
   */
  private String readMetadata(Map<String, Object> metadata, String primaryKey, String fallbackKey) {
    Object value = metadata.get(primaryKey);
    if (value == null && fallbackKey != null) {
      value = metadata.get(fallbackKey);
    }
    return value != null ? value.toString() : null;
  }

  /**
   * Converts a User entity to a UserResponse DTO.
   */
  private UserResponse toUserResponse(User user) {
    String email = encryptionService.decryptFromBytes(user.getEmailEncrypted());
    String displayName = user.getDisplayNameEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getDisplayNameEncrypted())
        : null;
    String fullName = user.getFullNameEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getFullNameEncrypted())
        : null;
    String location = user.getLocationEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getLocationEncrypted())
        : null;
    String dateOfBirth = user.getDobEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getDobEncrypted())
        : null;
    Integer age = user.getShowAge() != null && user.getShowAge()
        ? calculateAge(dateOfBirth)
        : null;

    String avatarUrl = buildPublicUrl(user.getAvatarKey());
    String avatarThumbUrl = buildPublicUrl(user.getAvatarThumbKey());

    return new UserResponse(
        user.getId(),
        email,
        displayName,
        fullName,
        user.getUsername(),
        user.getSex(),
        dateOfBirth,
        age,
        user.getShowAge(),
        user.getCountry(),
        location,
        user.getProfileVisibility().name(),
        user.getDisplayNamePublic(),
        user.getSearchableByEmail(),
        avatarUrl,
        avatarThumbUrl,
        user.getVerified(),
        user.getCreatedAt()
    );
  }

  private String buildPublicUrl(String key) {
    if (key == null || key.isBlank()) {
      return null;
    }
    return String.format("%s/%s/%s", storagePublicBaseUrl, avatarBucket, key);
  }

  private Integer calculateAge(String dateOfBirth) {
    if (dateOfBirth == null || dateOfBirth.isBlank()) {
      return null;
    }
    try {
      java.time.LocalDate dob = java.time.LocalDate.parse(dateOfBirth);
      java.time.LocalDate today = java.time.LocalDate.now();
      int age = today.getYear() - dob.getYear();
      if (today.getDayOfYear() < dob.getDayOfYear()) {
        age--;
      }
      return Math.max(age, 0);
    } catch (Exception ex) {
      log.warn("Failed to calculate age from dateOfBirth", ex);
      return null;
    }
  }
}
