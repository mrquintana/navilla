# Notification Privacy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all push notifications generic so no sensitive health info leaks on lock screens.

**Architecture:** One backend method change (replace specific title/body with "Navilla" / "You have a new update"), add missing i18n keys for in-app display, add unit test to enforce the privacy contract.

**Tech Stack:** Java 25 / Spring Boot, React i18n (en_US.json, es_MX.json), JUnit 5 + Mockito

---

### Task 1: Write NotificationService privacy test

**Files:**
- Create: `backend/src/test/java/app/navilla/service/NotificationServiceTest.java`

**Step 1: Write the failing test**

Create a unit test that verifies `sendPushForNotification` always sends generic content, never leaking the notification type or message key.

Since `sendPushForNotification` is private, we test it indirectly through the public `create()` method. We need to capture the `PushPayload` passed to `webPushService.sendPushToUser()` and verify its title and body are generic.

```java
/*
 * Copyright 2026 Navilla
 */
package app.navilla.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.UUID;

import app.navilla.dto.NotificationPayload;
import app.navilla.dto.PushPayload;
import app.navilla.entity.Notification;
import app.navilla.entity.NotificationType;
import app.navilla.metrics.NotificationMetrics;
import app.navilla.repository.NotificationRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService")
class NotificationServiceTest {

  @Mock private NotificationRepository notificationRepository;
  @Mock private EncryptionService encryptionService;
  @Mock private NotificationMetrics notificationMetrics;
  @Mock private WebPushService webPushService;
  @Mock private PushSubscriptionService pushSubscriptionService;

  private NotificationService service;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private static final String USER_HASH = "abc123hash";

  @BeforeEach
  void setUp() {
    service = new NotificationService(
        notificationRepository, encryptionService, objectMapper,
        notificationMetrics, webPushService, pushSubscriptionService);
  }

  @ParameterizedTest
  @EnumSource(NotificationType.class)
  @DisplayName("push payload must always use generic title and body for privacy")
  void pushPayloadMustBeGenericForAllTypes(NotificationType type) throws Exception {
    // Arrange — stub encryption + repository
    when(encryptionService.encrypt(any(String.class))).thenReturn(new byte[]{1, 2, 3});
    Notification saved = new Notification();
    saved.setId(UUID.randomUUID());
    when(notificationRepository.save(any())).thenReturn(saved);

    NotificationPayload payload = new NotificationPayload(
        type, "notifications.someKey", null);

    // Act
    service.create(USER_HASH, payload);

    // Assert — capture the PushPayload sent to webPushService
    ArgumentCaptor<PushPayload> captor = ArgumentCaptor.forClass(PushPayload.class);
    verify(webPushService).sendPushToUser(eq(USER_HASH), captor.capture(), any());

    PushPayload push = captor.getValue();
    assertThat(push.title()).isEqualTo("Navilla");
    assertThat(push.body()).isEqualTo("You have a new update");
    // Verify no notification type name leaks into title or body
    assertThat(push.title()).doesNotContainIgnoringCase(type.name());
    assertThat(push.body()).doesNotContainIgnoringCase(type.name());
  }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw test -pl . -Dtest=NotificationServiceTest -Dsurefire.failIfNoTests=false`
Expected: FAIL — title will be the enum name, not "Navilla"

**Step 3: Commit failing test**

```bash
git add backend/src/test/java/app/navilla/service/NotificationServiceTest.java
git commit -m "test: add NotificationService privacy test (red)"
git push
```

---

### Task 2: Make push payloads generic

**Files:**
- Modify: `backend/src/main/java/app/navilla/service/NotificationService.java:197-206`

**Step 1: Update `sendPushForNotification` method**

Change lines 201-202 from:
```java
PushPayload pushPayload = PushPayload.withDefaults(
    type.name(), messageKey, url, type.name());
```
to:
```java
PushPayload pushPayload = PushPayload.withDefaults(
    "Navilla", "You have a new update", url, type.name());
```

The `messageKey` parameter is no longer used in the push payload (it's still stored encrypted in the DB for in-app display). The `tag` stays as `type.name()` for notification grouping.

**Step 2: Run test to verify it passes**

Run: `cd backend && ./mvnw test -pl . -Dtest=NotificationServiceTest`
Expected: PASS

**Step 3: Run full test suite**

Run: `cd backend && ./mvnw test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/service/NotificationService.java
git commit -m "feat: make push notifications generic for lock screen privacy"
git push
```

---

### Task 3: Add missing i18n keys for in-app notification display

**Files:**
- Modify: `frontend/src/locales/en_US.json:301` (inside `"notifications"` object)
- Modify: `frontend/src/locales/es_MX.json:300` (inside `"notifications"` object)

**Step 1: Add English keys**

In `en_US.json`, after line 301 (`"generic": "You have a new notification"`), add before the closing `}`:

```json
    "exposureAlert": "You may have a new exposure — check your health log",
    "exposureCleared": "Good news — an exposure has been cleared",
    "medicationReminder": "Time for your medication",
    "vaccinationReminder": "You have an upcoming vaccination",
    "testingReminder": "It's time to schedule a test",
    "followUpReminder": "You have a follow-up to complete",
    "accountSecurity": "Important account security update"
```

**Step 2: Add Spanish keys**

In `es_MX.json`, after line 300 (`"generic": "Tienes una nueva notificación"`), add before the closing `}`:

```json
    "exposureAlert": "Podrías tener una nueva exposición — revisa tu registro de salud",
    "exposureCleared": "Buenas noticias — una exposición ha sido descartada",
    "medicationReminder": "Es hora de tu medicamento",
    "vaccinationReminder": "Tienes una vacunación próxima",
    "testingReminder": "Es hora de agendar una prueba",
    "followUpReminder": "Tienes un seguimiento pendiente",
    "accountSecurity": "Actualización importante de seguridad de tu cuenta"
```

**Step 3: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 4: Commit**

```bash
git add frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add missing notification i18n keys for in-app display"
git push
```

---

### Task 4: Verify end-to-end

**Step 1: Run full backend test suite**

Run: `cd backend && ./mvnw test`
Expected: All tests pass (including new NotificationServiceTest)

**Step 2: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 3: Final commit if any fixes needed**
