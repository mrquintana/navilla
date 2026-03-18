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

package app.navilla.exception;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import app.navilla.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler for REST API errors.
 *
 * <p>Provides consistent error responses with i18n support.
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

  private final MessageSource messageSource;

  /**
   * Handles resource not found exceptions.
   */
  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiError> handleResourceNotFound(
      ResourceNotFoundException ex,
      HttpServletRequest request,
      Locale locale) {

    String message = messageSource.getMessage(ex.getMessageKey(), null, locale);
    ApiError error = ApiError.of(
        HttpStatus.NOT_FOUND.value(),
        HttpStatus.NOT_FOUND.getReasonPhrase(),
        message,
        request.getRequestURI()
    );
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  /**
   * Handles illegal argument exceptions (bad request).
   */
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> handleIllegalArgument(
      IllegalArgumentException ex,
      HttpServletRequest request,
      Locale locale) {

    String message = messageSource.getMessage(ex.getMessage(), null, ex.getMessage(), locale);
    ApiError error = ApiError.of(
        HttpStatus.BAD_REQUEST.value(),
        HttpStatus.BAD_REQUEST.getReasonPhrase(),
        message,
        request.getRequestURI()
    );
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  /**
   * Handles illegal state exceptions (conflict).
   */
  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiError> handleIllegalState(
      IllegalStateException ex,
      HttpServletRequest request,
      Locale locale) {

    String message = messageSource.getMessage(ex.getMessage(), null, ex.getMessage(), locale);
    ApiError error = ApiError.of(
        HttpStatus.CONFLICT.value(),
        HttpStatus.CONFLICT.getReasonPhrase(),
        message,
        request.getRequestURI()
    );
    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
  }

  /**
   * Handles cooldown active exceptions (403 Forbidden).
   */
  @ExceptionHandler(CooldownActiveException.class)
  public ResponseEntity<ApiError> handleCooldownActive(
      CooldownActiveException ex,
      HttpServletRequest request,
      Locale locale) {

    String message = messageSource.getMessage(ex.getMessageKey(), null, ex.getMessageKey(), locale);
    List<String> details = List.of("daysRemaining:" + ex.getDaysRemaining());
    ApiError error = ApiError.of(
        HttpStatus.FORBIDDEN.value(),
        HttpStatus.FORBIDDEN.getReasonPhrase(),
        message,
        request.getRequestURI(),
        details
    );
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
  }

  /**
   * Handles rate limit exceeded exceptions (429 Too Many Requests).
   */
  @ExceptionHandler(RateLimitException.class)
  public ResponseEntity<ApiError> handleRateLimit(
      RateLimitException ex,
      HttpServletRequest request,
      Locale locale) {

    String message = messageSource.getMessage(ex.getMessageKey(), null, ex.getMessageKey(), locale);
    ApiError error = ApiError.of(
        429,
        "Too Many Requests",
        message,
        request.getRequestURI()
    );
    return ResponseEntity.status(429)
        .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
        .body(error);
  }

  /**
   * Handles connection conflict exceptions.
   */
  @ExceptionHandler(ConnectionConflictException.class)
  public ResponseEntity<ApiError> handleConnectionConflict(
      ConnectionConflictException ex,
      HttpServletRequest request,
      Locale locale) {

    String message = messageSource.getMessage(ex.getMessageKey(), null, ex.getMessageKey(), locale);
    List<String> details = buildConnectionConflictDetails(ex.getExistingConnectionId());
    ApiError error = ApiError.of(
        HttpStatus.CONFLICT.value(),
        HttpStatus.CONFLICT.getReasonPhrase(),
        message,
        request.getRequestURI(),
        details
    );
    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
  }

  /**
   * Handles validation errors.
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidationErrors(
      MethodArgumentNotValidException ex,
      HttpServletRequest request,
      Locale locale) {

    List<String> details = ex.getBindingResult().getAllErrors().stream()
        .map(error -> {
          if (error instanceof FieldError fieldError) {
            return fieldError.getField() + ": " + error.getDefaultMessage();
          }
          return error.getDefaultMessage();
        })
        .toList();

    String message = messageSource.getMessage("common.error.validation", null, locale);
    ApiError error = ApiError.of(
        HttpStatus.BAD_REQUEST.value(),
        HttpStatus.BAD_REQUEST.getReasonPhrase(),
        message,
        request.getRequestURI(),
        details
    );
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  /**
   * Handles all other exceptions.
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGenericException(
      Exception ex,
      HttpServletRequest request,
      Locale locale) {

    log.error("Unexpected error occurred", ex);

    String message = messageSource.getMessage("common.error.internal", null, locale);
    ApiError error = ApiError.of(
        HttpStatus.INTERNAL_SERVER_ERROR.value(),
        HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
        message,
        request.getRequestURI()
    );
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
  }

  private List<String> buildConnectionConflictDetails(UUID connectionId) {
    if (connectionId == null) {
      return null;
    }
    return List.of("existingConnectionId:" + connectionId);
  }
}
