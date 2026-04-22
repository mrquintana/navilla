# Week 8: Personal Insights + Onboarding + Quick Wins — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Personal Insights dashboard, toast notifications, route code splitting, encounter type/protection fields, guided onboarding, and PrEP adherence streaks.

**Architecture:** Six independent workstreams that can largely be built in parallel. Toast system is foundational (used by all mutations). Route code splitting is a pure frontend refactor. Encounter fields require a database migration + backend + frontend changes. Insights page aggregates existing endpoints. Onboarding is a self-contained flow triggered from DashboardPage. PrEP streaks extend the existing medication adherence API.

**Tech Stack:** React 19, React Router 7, TanStack React Query, Spring Boot 4.0.2, Java 25, PostgreSQL (Supabase), i18next, Tailwind CSS, Vitest, Vite

---

## Task 1: Toast Notification System

**Files:**
- Create: `frontend/src/contexts/ToastContext.tsx`
- Create: `frontend/src/components/ui/Toast.tsx`
- Create: `frontend/src/components/ui/__tests__/Toast.test.tsx`
- Modify: `frontend/src/App.tsx` — wrap with `ToastProvider`
- Modify: `frontend/src/locales/en_US.json` — add toast keys
- Modify: `frontend/src/locales/es_MX.json` — add toast keys

### Step 1: Write the Toast context and component

Create `frontend/src/contexts/ToastContext.tsx`:
```tsx
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext>
  );
}
```

Create `frontend/src/components/ui/Toast.tsx`:
```tsx
import { X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const typeStyles: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-indigo-50 border-indigo-200 text-indigo-800',
};

const iconMap: Record<string, string> = {
  success: '\u2713',
  error: '\u2717',
  info: '\u24D8',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm animate-slide-in ${typeStyles[toast.type] ?? typeStyles.info}`}
          role="status"
        >
          <span className="font-bold" aria-hidden="true">{iconMap[toast.type]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            className="p-0.5 rounded hover:bg-black/5 transition-colors"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Step 2: Add slide-in animation CSS

Add to `frontend/src/index.css` (or the global CSS file):
```css
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}
```

### Step 3: Wire ToastProvider + ToastContainer into App.tsx

Modify `frontend/src/App.tsx`:
- Import `ToastProvider` from `./contexts/ToastContext`
- Import `ToastContainer` from `./components/ui/Toast`
- Wrap the `<AuthProvider>` children with `<ToastProvider>` and add `<ToastContainer />` inside it

### Step 4: Write tests for Toast

Create `frontend/src/components/ui/__tests__/Toast.test.tsx`:
- Test: `addToast` renders a toast message
- Test: toast auto-dismisses after timeout (use `vi.useFakeTimers`)
- Test: `removeToast` removes a specific toast
- Test: renders correct style class for each type

### Step 5: Run tests

Run: `cd frontend && npm test -- --run Toast`
Expected: All tests pass

### Step 6: Add locale keys for common toast messages

Add to `en_US.json` under a new `"toast"` key:
```json
"toast": {
  "saved": "Saved successfully",
  "deleted": "Deleted successfully",
  "error": "Something went wrong. Please try again.",
  "snoozed": "Reminder snoozed",
  "completed": "Marked as complete"
}
```

Add equivalent Spanish keys to `es_MX.json`.

### Step 7: Integrate toasts into existing mutation hooks

Add `useToast()` calls to `onSuccess` / `onError` callbacks in key hooks:
- `useCreateJournalEntry`, `useUpdateJournalEntry`, `useDeleteJournalEntry` in `hooks/useJournal.ts`
- `useCreateMedication`, `useUpdateMedication`, `useDeleteMedication`, `useLogDose` in `hooks/useMedications.ts`
- `useCreateVaccination`, `useUpdateVaccination`, `useDeleteVaccination` in `hooks/useVaccinations.ts`
- Reminder hooks: snooze, complete, toggle, delete in `hooks/useReminders.ts`

**Pattern for each hook:**
```tsx
const { addToast } = useToast();
// In mutation:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['...'] });
  addToast('success', t('toast.saved'));
},
onError: () => {
  addToast('error', t('toast.error'));
},
```

**Note:** Since hooks can't call `useTranslation()` inside the mutation callbacks directly, pass the toast message as a parameter or use a wrapper pattern. The simplest approach: the hooks accept an optional `onSuccess` callback from the calling component, and the component provides the toast call. OR: the hooks return the mutation directly and the component calls `addToast` in `.then()`. Choose the cleanest approach that doesn't break existing consumers.

**Recommended approach:** Don't modify the hooks themselves. Instead, create a thin wrapper pattern where components call `addToast` after `await mutation.mutateAsync(...)` in their submit handlers (JournalEntryModal, MedicationModal, VaccinationModal, etc.). This avoids coupling hooks to the toast context and is the simplest path.

### Step 8: Commit

```bash
git add frontend/src/contexts/ToastContext.tsx frontend/src/components/ui/Toast.tsx frontend/src/components/ui/__tests__/Toast.test.tsx frontend/src/App.tsx frontend/src/locales/en_US.json frontend/src/locales/es_MX.json frontend/src/index.css
git commit -m "feat: add toast notification system with auto-dismiss"
git push
```

---

## Task 2: Route-Level Code Splitting

**Files:**
- Modify: `frontend/src/router.tsx` — convert all page imports to `React.lazy()`

### Step 1: Refactor router.tsx to use lazy imports

Replace all static page imports with lazy imports:
```tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { FullPageLoader } from './components/ui/LoadingShell';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage').then(m => ({ default: m.ConnectionsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const HealthLogPage = lazy(() => import('./pages/HealthLogPage').then(m => ({ default: m.HealthLogPage })));
const ConditionDetailPage = lazy(() => import('./pages/ConditionDetailPage').then(m => ({ default: m.ConditionDetailPage })));
const MedicationDetailPage = lazy(() => import('./pages/MedicationDetailPage').then(m => ({ default: m.MedicationDetailPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const JournalPage = lazy(() => import('./pages/JournalPage').then(m => ({ default: m.JournalPage })));
const PartnerDetailPage = lazy(() => import('./pages/PartnerDetailPage').then(m => ({ default: m.PartnerDetailPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })));
// Layer 0 / content pages
const WindowPeriodCalculatorPage = lazy(() => import('./pages/WindowPeriodCalculatorPage').then(m => ({ default: m.WindowPeriodCalculatorPage })));
const GuidesIndexPage = lazy(() => import('./pages/GuidesIndexPage').then(m => ({ default: m.GuidesIndexPage })));
const GuideDetailPage = lazy(() => import('./pages/GuideDetailPage').then(m => ({ default: m.GuideDetailPage })));
const TestingCostPage = lazy(() => import('./pages/TestingCostPage').then(m => ({ default: m.TestingCostPage })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const CareersPage = lazy(() => import('./pages/CareersPage').then(m => ({ default: m.CareersPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const SecurityPage = lazy(() => import('./pages/SecurityPage').then(m => ({ default: m.SecurityPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const StatusPage = lazy(() => import('./pages/StatusPage').then(m => ({ default: m.StatusPage })));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage').then(m => ({ default: m.AccessibilityPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ErrorPage = lazy(() => import('./pages/ErrorPage').then(m => ({ default: m.ErrorPage })));
```

Wrap each route element in `<Suspense fallback={<FullPageLoader />}>`:
```tsx
{
  path: 'dashboard',
  element: (
    <ProtectedRoute>
      <Suspense fallback={<FullPageLoader />}>
        <DashboardPage />
      </Suspense>
    </ProtectedRoute>
  ),
},
```

**Note:** Layout, AuthLayout, ProtectedRoute, and FullPageLoader remain static imports (they're needed immediately on every page).

### Step 2: Verify build produces chunked output

Run: `cd frontend && npm run build`
Check: `dist/assets/` should now contain multiple JS chunks instead of one large bundle.
Run: `ls -la frontend/dist/assets/*.js | wc -l` — should be >10 files.

### Step 3: Run existing tests

Run: `cd frontend && npm test`
Expected: All existing tests pass (lazy loading shouldn't break tests since test renders use direct imports).

### Step 4: Commit

```bash
git add frontend/src/router.tsx
git commit -m "perf: add route-level code splitting with React.lazy"
git push
```

---

## Task 3: Encounter Type + Protection Fields (Backend)

**Files:**
- Create: `database/migrations/012_encounter_fields.sql`
- Modify: `backend/src/main/java/app/navilla/entity/EncounterJournal.java` — add new columns
- Modify: `backend/src/main/java/app/navilla/dto/CreateJournalEntryRequest.java` — add new fields
- Modify: `backend/src/main/java/app/navilla/dto/UpdateJournalEntryRequest.java` — add new fields
- Modify: `backend/src/main/java/app/navilla/dto/JournalEntryResponse.java` — add new fields
- Modify: `backend/src/main/java/app/navilla/service/EncounterJournalService.java` — handle new fields
- Create: `backend/src/test/java/app/navilla/service/EncounterJournalServiceEncounterFieldsTest.java`

### Step 1: Create database migration

Create `database/migrations/012_encounter_fields.sql`:
```sql
-- Navilla Database Schema
-- Migration 012: Encounter type + protection method fields
-- Purpose: Add structured encounter type and protection method fields to journal entries
--
-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE encounter_journal DROP COLUMN IF EXISTS encounter_types_encrypted;
-- ALTER TABLE encounter_journal DROP COLUMN IF EXISTS protection_methods_encrypted;
-- COMMIT;

BEGIN;

-- Encrypted JSON arrays: e.g. ["ORAL","ANAL"] and ["CONDOM","PREP"]
ALTER TABLE encounter_journal ADD COLUMN encounter_types_encrypted BYTEA;
ALTER TABLE encounter_journal ADD COLUMN protection_methods_encrypted BYTEA;

COMMENT ON COLUMN encounter_journal.encounter_types_encrypted IS 'AES-256-GCM encrypted JSON array of encounter type strings.';
COMMENT ON COLUMN encounter_journal.protection_methods_encrypted IS 'AES-256-GCM encrypted JSON array of protection method strings.';

COMMIT;
```

### Step 2: Update EncounterJournal entity

Add to `backend/src/main/java/app/navilla/entity/EncounterJournal.java`:
```java
@Column(name = "encounter_types_encrypted")
private byte[] encounterTypesEncrypted;

@Column(name = "protection_methods_encrypted")
private byte[] protectionMethodsEncrypted;
```

### Step 3: Update DTOs

Add to `CreateJournalEntryRequest`:
```java
@Size(max = 10, message = "{journal.error.tooManyEncounterTypes}")
List<String> encounterTypes,

@Size(max = 10, message = "{journal.error.tooManyProtectionMethods}")
List<String> protectionMethods
```

Add same fields to `UpdateJournalEntryRequest`.

Add to `JournalEntryResponse`:
```java
List<String> encounterTypes,
List<String> protectionMethods
```

### Step 4: Update EncounterJournalService

Add encrypt/decrypt helpers for string lists (similar to customFields pattern):
```java
private byte[] encryptStringList(List<String> items) {
    if (items == null || items.isEmpty()) return null;
    try {
        String json = objectMapper.writeValueAsString(items);
        return encryptionService.encryptToBytes(json);
    } catch (Exception ex) {
        throw new RuntimeException("Failed to serialize string list", ex);
    }
}

private List<String> decryptStringList(byte[] encrypted) {
    if (encrypted == null) return null;
    try {
        String json = encryptionService.decryptFromBytes(encrypted);
        return objectMapper.readValue(json, new TypeReference<List<String>>() {});
    } catch (Exception ex) {
        throw new RuntimeException("Failed to deserialize string list", ex);
    }
}
```

In `createEntry` and `updateEntry`, set the new encrypted fields:
```java
entry.setEncounterTypesEncrypted(encryptStringList(request.encounterTypes()));
entry.setProtectionMethodsEncrypted(encryptStringList(request.protectionMethods()));
```

In `toResponse`, decrypt and include:
```java
return new JournalEntryResponse(
    // ... existing fields ...
    decryptStringList(entry.getEncounterTypesEncrypted()),
    decryptStringList(entry.getProtectionMethodsEncrypted()),
    entry.getCreatedAt(),
    entry.getUpdatedAt()
);
```

**Important:** The `JournalEntryResponse` constructor order changes — ensure `encounterTypes` and `protectionMethods` are added BEFORE `createdAt`/`updatedAt` to keep related fields together.

### Step 5: Add catalog entries for encounter types and protection methods

Add to `CatalogController` (or the catalog data source) the valid values:
```
encounterTypes: ORAL, ANAL, VAGINAL, MANUAL, OTHER
protectionMethods: CONDOM, INTERNAL_CONDOM, PREP, PEP, DENTAL_DAM, NONE, OTHER
```

### Step 6: Write tests

Create `backend/src/test/java/app/navilla/service/EncounterJournalServiceEncounterFieldsTest.java`:
- Test: create entry with encounter types and protection methods → fields are encrypted and decrypted correctly
- Test: create entry without encounter types/protection → fields are null in response
- Test: update entry to add/change encounter types
- Test: list entries includes the new fields

### Step 7: Run backend tests

Run: `cd backend && ./mvnw test`
Expected: All tests pass (existing + new)

### Step 8: Commit

```bash
git add database/migrations/012_encounter_fields.sql backend/src/main/java/app/navilla/entity/EncounterJournal.java backend/src/main/java/app/navilla/dto/CreateJournalEntryRequest.java backend/src/main/java/app/navilla/dto/UpdateJournalEntryRequest.java backend/src/main/java/app/navilla/dto/JournalEntryResponse.java backend/src/main/java/app/navilla/service/EncounterJournalService.java backend/src/test/java/app/navilla/service/EncounterJournalServiceEncounterFieldsTest.java
git commit -m "feat: add encounter type and protection method fields to journal entries"
git push
```

---

## Task 4: Encounter Type + Protection Fields (Frontend)

**Files:**
- Modify: `frontend/src/lib/api.ts` — add new fields to types
- Modify: `frontend/src/components/journal/JournalEntryModal.tsx` — add multi-select UI
- Modify: `frontend/src/locales/en_US.json` — encounter type + protection labels
- Modify: `frontend/src/locales/es_MX.json` — encounter type + protection labels
- Create: `frontend/src/components/journal/__tests__/JournalEntryModal.encounterFields.test.tsx`

### Step 1: Update API types

Add to `JournalEntry` interface in `api.ts`:
```typescript
encounterTypes: string[] | null;
protectionMethods: string[] | null;
```

Add to `CreateJournalEntryRequest` and `UpdateJournalEntryRequest`:
```typescript
encounterTypes?: string[];
protectionMethods?: string[];
```

### Step 2: Add locale keys

Add to `en_US.json` under `"journal"`:
```json
"encounterType": "Type of encounter",
"protectionMethods": "Protection used",
"encounterTypes": {
  "ORAL": "Oral",
  "ANAL": "Anal",
  "VAGINAL": "Vaginal",
  "MANUAL": "Manual",
  "OTHER": "Other"
},
"protectionLabels": {
  "CONDOM": "External condom",
  "INTERNAL_CONDOM": "Internal condom",
  "PREP": "PrEP",
  "PEP": "PEP",
  "DENTAL_DAM": "Dental dam",
  "NONE": "None",
  "OTHER": "Other"
}
```

Add Spanish equivalents to `es_MX.json`.

### Step 3: Add multi-select chip UI to JournalEntryModal

In `JournalEntryModal.tsx`, add two new form state arrays:
```typescript
const [formEncounterTypes, setFormEncounterTypes] = useState<string[]>(entry?.encounterTypes ?? []);
const [formProtectionMethods, setFormProtectionMethods] = useState<string[]>(entry?.protectionMethods ?? []);
```

Add toggle chip components between the partner alias and notes fields:
```tsx
{/* Encounter types — multi-select chips */}
<div>
  <label className="label">{t('journal.encounterType')}</label>
  <div className="flex flex-wrap gap-1.5">
    {['ORAL', 'ANAL', 'VAGINAL', 'MANUAL', 'OTHER'].map((type) => {
      const selected = formEncounterTypes.includes(type);
      return (
        <button
          key={type}
          type="button"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected
              ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
              : 'bg-white border-stone-200 text-stone-600 hover:border-indigo-200'
          }`}
          onClick={() =>
            setFormEncounterTypes((prev) =>
              selected ? prev.filter((t) => t !== type) : [...prev, type]
            )
          }
        >
          {t(`journal.encounterTypes.${type}`)}
        </button>
      );
    })}
  </div>
</div>
```

Same pattern for protection methods.

Include in submit data:
```typescript
const data = {
  // ...existing fields...
  encounterTypes: formEncounterTypes.length > 0 ? formEncounterTypes : undefined,
  protectionMethods: formProtectionMethods.length > 0 ? formProtectionMethods : undefined,
};
```

### Step 4: Update JournalEntryCard and JournalTimeline to display the new fields

Show small badges/chips for encounter types and protection methods on each journal entry card.

### Step 5: Write tests

Test: selecting encounter type chips toggles them on/off
Test: form submits with selected encounter types
Test: editing an entry pre-selects existing values

### Step 6: Run tests and lint

Run: `cd frontend && npm test && npm run lint`
Expected: All pass

### Step 7: Commit

```bash
git add frontend/src/lib/api.ts frontend/src/components/journal/JournalEntryModal.tsx frontend/src/locales/en_US.json frontend/src/locales/es_MX.json frontend/src/components/journal/__tests__/
git commit -m "feat: add encounter type and protection method multi-select to journal"
git push
```

---

## Task 5: Personal Insights Page (Backend)

**Files:**
- Create: `backend/src/main/java/app/navilla/dto/InsightsResponse.java`
- Create: `backend/src/main/java/app/navilla/service/InsightsService.java`
- Create: `backend/src/main/java/app/navilla/controller/InsightsController.java`
- Create: `backend/src/test/java/app/navilla/service/InsightsServiceTest.java`
- Create: `backend/src/test/java/app/navilla/controller/InsightsControllerTest.java`

### Step 1: Create InsightsResponse DTO

```java
package app.navilla.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record InsightsResponse(
    ActivitySummary activity,
    TestingSummary testing,
    PreventionSummary prevention
) {
    public record ActivitySummary(
        int totalEncounters,
        int encountersThisMonth,
        Map<String, Integer> encountersByMonth,  // YYYY-MM -> count
        double protectionRate,                     // 0.0 - 1.0
        Map<String, Integer> encounterTypeCounts,  // type -> count
        Map<String, Integer> protectionMethodCounts // method -> count
    ) {}

    public record TestingSummary(
        int daysSinceLastTest,
        int testsThisYear,
        int conditionsCovered,
        int totalStandardConditions,
        LocalDate lastTestDate,
        Map<String, String> coverageMap  // condition -> latestStatus
    ) {}

    public record PreventionSummary(
        Double prepAdherenceRate,     // null if no PrEP medication
        int currentPrepStreakDays,
        int longestPrepStreakDays,
        List<String> completedVaccines,
        List<String> pendingVaccines,
        int activeReminders
    ) {}
}
```

### Step 2: Create InsightsService

The service aggregates data from existing repositories — no new DB queries needed for most fields:
- Activity: query `EncounterJournalRepository` for counts, decrypt encounter types/protection to compute rates
- Testing: delegate to `HealthLogService.getSummary()` or query repositories directly
- Prevention: query `MedicationRepository` for PrEP meds, `MedicationLogRepository` for adherence, `VaccinationRepository` for vaccine status, `ReminderRepository` for active count

For PrEP streaks, calculate from `medication_logs`:
```java
// Find active PrEP medications
List<Medication> prepMeds = medicationRepository.findByUserHashAndMedicationType(userHash, "PREP");
// For each, query logs ordered by date, calculate current streak (consecutive days with taken=true)
```

### Step 3: Create InsightsController

```java
@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightsController {
    private final InsightsService insightsService;

    @GetMapping
    public ResponseEntity<InsightsResponse> getInsights(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(insightsService.getInsights(jwt));
    }
}
```

### Step 4: Write tests

InsightsServiceTest:
- Test: user with no data gets zeroed response
- Test: user with encounters gets correct activity summary
- Test: protection rate calculated correctly (entries with non-NONE protection / total entries)
- Test: PrEP streak calculation (consecutive days taken)
- Test: testing summary matches health log data

InsightsControllerTest:
- Test: GET /api/insights returns 200 with valid response
- Test: unauthenticated request returns 401

### Step 5: Run backend tests

Run: `cd backend && ./mvnw test`
Expected: All pass

### Step 6: Commit

```bash
git add backend/src/main/java/app/navilla/dto/InsightsResponse.java backend/src/main/java/app/navilla/service/InsightsService.java backend/src/main/java/app/navilla/controller/InsightsController.java backend/src/test/java/app/navilla/service/InsightsServiceTest.java backend/src/test/java/app/navilla/controller/InsightsControllerTest.java
git commit -m "feat: add insights API aggregating activity, testing, and prevention data"
git push
```

---

## Task 6: Personal Insights Page (Frontend)

**Files:**
- Create: `frontend/src/pages/InsightsPage.tsx`
- Create: `frontend/src/hooks/useInsights.ts`
- Modify: `frontend/src/lib/api.ts` — add insights types and endpoint
- Modify: `frontend/src/router.tsx` — add /insights route
- Modify: `frontend/src/pages/DashboardPage.tsx` — add "View Insights" quick action
- Modify: `frontend/src/locales/en_US.json` — insights keys
- Modify: `frontend/src/locales/es_MX.json` — insights keys
- Modify: `frontend/src/components/layout/Header.tsx` — add nav link (if applicable)
- Create: `frontend/src/pages/__tests__/InsightsPage.test.tsx`

### Step 1: Add API types and endpoint

In `api.ts`, add:
```typescript
export interface InsightsResponse {
  activity: {
    totalEncounters: number;
    encountersThisMonth: number;
    encountersByMonth: Record<string, number>;
    protectionRate: number;
    encounterTypeCounts: Record<string, number>;
    protectionMethodCounts: Record<string, number>;
  };
  testing: {
    daysSinceLastTest: number;
    testsThisYear: number;
    conditionsCovered: number;
    totalStandardConditions: number;
    lastTestDate: string | null;
    coverageMap: Record<string, string>;
  };
  prevention: {
    prepAdherenceRate: number | null;
    currentPrepStreakDays: number;
    longestPrepStreakDays: number;
    completedVaccines: string[];
    pendingVaccines: string[];
    activeReminders: number;
  };
}
```

Add to `api` object:
```typescript
insights: {
  get: (token: string) => apiRequest<InsightsResponse>('/api/insights', token),
},
```

### Step 2: Create useInsights hook

```typescript
// frontend/src/hooks/useInsights.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api, type InsightsResponse } from '../lib/api';

export type { InsightsResponse };

export function useInsights() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => api.insights.get(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
```

### Step 3: Create InsightsPage

Three-section layout following design system:

**Activity Summary Card:**
- Encounters this month / total
- Protection rate as a progress bar (percentage)
- Encounter type breakdown (horizontal bar chart or chip counts)
- Monthly trend (simple sparkline or bar chart using CSS)

**Testing Summary Card:**
- Days since last test (prominent number)
- Tests this year
- Condition coverage (X/10 with progress bar)
- Coverage map showing each condition's latest status (colored badges)

**Prevention Summary Card:**
- PrEP adherence rate (if applicable, with streak display)
- PrEP streak milestones: 7-day, 30-day, 90-day with celebration badges
- Vaccination status (completed / pending with icons)
- Active reminders count

**Design notes:**
- Use warm stone backgrounds with indigo accents
- Cards follow `card card-elevated` pattern
- Numbers use `text-4xl font-bold` with indigo color
- Progress bars use indigo gradient
- Mobile-first layout: single column on mobile, 2-3 col grid on md+

### Step 4: Add route and navigation

Add to `router.tsx`:
```tsx
{
  path: 'insights',
  element: (
    <ProtectedRoute>
      <Suspense fallback={<FullPageLoader />}>
        <InsightsPage />
      </Suspense>
    </ProtectedRoute>
  ),
},
```

Add to DashboardPage quick actions grid (change from 3-col to 4-col, or add as a 4th item):
```tsx
<Link to="/insights" ...>
  <BarChart3 className="w-4 h-4" />
  {t('dashboard.goToInsights')}
</Link>
```

### Step 5: Add locale keys

Add `"insights"` section to both locale files with all labels:
- Section headers: activity, testing, prevention
- Field labels: encounters, protectionRate, daysSinceTest, etc.
- Streak milestones: streak7, streak30, streak90
- Empty states for each section

### Step 6: Write tests

InsightsPage test:
- Test: renders loading state
- Test: renders all three summary sections
- Test: displays protection rate correctly
- Test: displays PrEP streak milestone badges

### Step 7: Run tests and lint

Run: `cd frontend && npm test && npm run lint`
Expected: All pass

### Step 8: Commit

```bash
git add frontend/src/pages/InsightsPage.tsx frontend/src/hooks/useInsights.ts frontend/src/lib/api.ts frontend/src/router.tsx frontend/src/pages/DashboardPage.tsx frontend/src/locales/ frontend/src/pages/__tests__/InsightsPage.test.tsx
git commit -m "feat: add personal insights dashboard with activity, testing, and prevention summaries"
git push
```

---

## Task 7: Guided Onboarding Flow

**Files:**
- Create: `frontend/src/components/onboarding/OnboardingFlow.tsx`
- Create: `frontend/src/components/onboarding/__tests__/OnboardingFlow.test.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx` — trigger onboarding for new users
- Modify: `frontend/src/locales/en_US.json` — onboarding keys
- Modify: `frontend/src/locales/es_MX.json` — onboarding keys

### Step 1: Create OnboardingFlow component

A 3-step guided flow shown to first-time users (determined by localStorage flag `navilla_onboarding_complete`):

**Step 1: "Log your first test"**
- Brief explanation of the Health Log
- CTA button → navigates to /health-log with `?action=add-visit`

**Step 2: "Set up reminders"**
- Brief explanation of reminders for testing + medications
- CTA button → navigates to /health-log (medications tab)

**Step 3: "Explore your dashboard"**
- Brief explanation of what the dashboard shows
- CTA button → dismisses onboarding, sets `navilla_onboarding_complete=true`

**Design:**
- Modal overlay with step indicator (dots)
- Indigo gradient header with icon
- Clean, minimal body text
- "Skip" link in corner, "Next" / "Get Started" primary buttons
- Animations between steps (CSS transitions)

```tsx
// Component structure
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    { icon: Heart, titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body', action: () => navigate('/health-log?action=add-visit') },
    { icon: Bell, titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body', action: () => navigate('/health-log') },
    { icon: BarChart3, titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body', action: () => { localStorage.setItem('navilla_onboarding_complete', 'true'); onComplete(); } },
  ];

  const handleSkip = () => {
    localStorage.setItem('navilla_onboarding_complete', 'true');
    onComplete();
  };

  // ... render modal with current step
}
```

### Step 2: Integrate into DashboardPage

In `DashboardPage`, check localStorage and show onboarding:
```tsx
const [showOnboarding, setShowOnboarding] = useState(
  () => localStorage.getItem('navilla_onboarding_complete') !== 'true'
);

// After loading check, before main content:
{showOnboarding && (
  <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
)}
```

### Step 3: Add locale keys

Add `"onboarding"` section:
```json
"onboarding": {
  "step1Title": "Log your first test",
  "step1Body": "Keep track of your STI testing history. We'll help you stay on top of your health.",
  "step2Title": "Set up reminders",
  "step2Body": "Never miss a medication dose or testing appointment. Set up smart reminders.",
  "step3Title": "Explore your dashboard",
  "step3Body": "Your personal health insights are ready. View trends, track progress, and stay informed.",
  "next": "Next",
  "skip": "Skip for now",
  "getStarted": "Get started",
  "stepOf": "Step {{current}} of {{total}}"
}
```

### Step 4: Write tests

- Test: renders step 1 initially
- Test: clicking Next advances to step 2
- Test: clicking Skip sets localStorage and calls onComplete
- Test: completing step 3 sets localStorage flag
- Test: does not render if localStorage flag is already set

### Step 5: Run tests

Run: `cd frontend && npm test && npm run lint`
Expected: All pass

### Step 6: Commit

```bash
git add frontend/src/components/onboarding/OnboardingFlow.tsx frontend/src/components/onboarding/__tests__/OnboardingFlow.test.tsx frontend/src/pages/DashboardPage.tsx frontend/src/locales/
git commit -m "feat: add guided onboarding flow for first-time users"
git push
```

---

## Task 8: PrEP Adherence Streaks (Backend)

**Files:**
- Modify: `backend/src/main/java/app/navilla/service/MedicationService.java` — add streak calculation
- Create: `backend/src/main/java/app/navilla/dto/PrepStreakResponse.java`
- Modify: `backend/src/main/java/app/navilla/controller/MedicationController.java` — add streak endpoint
- Create: `backend/src/test/java/app/navilla/service/MedicationServiceStreakTest.java`

### Step 1: Create PrepStreakResponse DTO

```java
public record PrepStreakResponse(
    int currentStreakDays,
    int longestStreakDays,
    List<Milestone> milestones
) {
    public record Milestone(
        int days,
        String labelKey,
        boolean achieved
    ) {}
}
```

### Step 2: Add streak calculation to MedicationService

```java
public PrepStreakResponse getPrepStreak(Jwt jwt) {
    String userHash = hashEmail(jwt);

    // Find active PrEP medications
    List<Medication> prepMeds = medicationRepository
        .findByUserHashAndMedicationTypeAndActive(userHash, "PREP", true);

    if (prepMeds.isEmpty()) {
        return new PrepStreakResponse(0, 0, buildMilestones(0, 0));
    }

    // Get all dose logs for PrEP meds, ordered by scheduled date DESC
    List<MedicationLog> allLogs = new ArrayList<>();
    for (Medication med : prepMeds) {
        allLogs.addAll(medicationLogRepository
            .findByMedicationIdOrderByScheduledForDesc(med.getId()));
    }

    // Calculate current streak: consecutive days from today backwards with taken=true
    int currentStreak = calculateCurrentStreak(allLogs);
    int longestStreak = calculateLongestStreak(allLogs);

    return new PrepStreakResponse(currentStreak, longestStreak,
        buildMilestones(currentStreak, longestStreak));
}

private List<PrepStreakResponse.Milestone> buildMilestones(int current, int longest) {
    int best = Math.max(current, longest);
    return List.of(
        new PrepStreakResponse.Milestone(7, "streaks.week", best >= 7),
        new PrepStreakResponse.Milestone(30, "streaks.month", best >= 30),
        new PrepStreakResponse.Milestone(90, "streaks.quarter", best >= 90)
    );
}
```

### Step 3: Add endpoint

```java
@GetMapping("/prep-streak")
public ResponseEntity<PrepStreakResponse> getPrepStreak(
        @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(medicationService.getPrepStreak(jwt));
}
```

### Step 4: Write tests

- Test: no PrEP medications → streak 0, no milestones achieved
- Test: 7 consecutive days → current streak 7, week milestone achieved
- Test: gap in middle → current streak resets, longest preserves previous
- Test: 30+ consecutive days → month milestone achieved
- Test: dose marked taken=false breaks streak

### Step 5: Run tests

Run: `cd backend && ./mvnw test`
Expected: All pass

### Step 6: Commit

```bash
git add backend/src/main/java/app/navilla/dto/PrepStreakResponse.java backend/src/main/java/app/navilla/service/MedicationService.java backend/src/main/java/app/navilla/controller/MedicationController.java backend/src/test/java/app/navilla/service/MedicationServiceStreakTest.java
git commit -m "feat: add PrEP adherence streak calculation with milestones"
git push
```

---

## Task 9: PrEP Streaks (Frontend) + Insights Integration

**Files:**
- Modify: `frontend/src/lib/api.ts` — add streak types and endpoint
- Modify: `frontend/src/hooks/useMedications.ts` — add usePrepStreak hook
- Modify: `frontend/src/pages/InsightsPage.tsx` — integrate streak display with milestone celebrations
- Modify: `frontend/src/locales/en_US.json` — streak locale keys
- Modify: `frontend/src/locales/es_MX.json` — streak locale keys

### Step 1: Add API types and hook

```typescript
export interface PrepStreak {
  currentStreakDays: number;
  longestStreakDays: number;
  milestones: { days: number; labelKey: string; achieved: boolean }[];
}
```

Add to `api.medications`:
```typescript
prepStreak: (token: string) => apiRequest<PrepStreak>('/api/medications/prep-streak', token),
```

Add `usePrepStreak` to `useMedications.ts`.

### Step 2: Add streak display to Insights Prevention section

Show:
- Current streak number with flame/fire icon
- Milestone badges (7-day, 30-day, 90-day) — achieved ones are indigo, pending are muted
- Celebration message when milestones are newly achieved
- Longest streak as secondary stat

### Step 3: Add locale keys

```json
"streaks": {
  "currentStreak": "Current streak",
  "longestStreak": "Longest streak",
  "days": "{{count}} days",
  "week": "1 Week",
  "month": "1 Month",
  "quarter": "3 Months",
  "milestone": "Milestone reached!",
  "keepGoing": "Keep it up! {{remaining}} days to next milestone."
}
```

### Step 4: Commit

```bash
git add frontend/src/lib/api.ts frontend/src/hooks/useMedications.ts frontend/src/pages/InsightsPage.tsx frontend/src/locales/
git commit -m "feat: display PrEP adherence streaks with milestone badges in insights"
git push
```

---

## Task 10: Final Integration + Documentation + E2E Mocks

**Files:**
- Modify: `frontend/src/lib/api.ts` — add E2E mocks for insights and streak endpoints
- Modify: `frontend/scripts/prerender.ts` — add /insights to prerender if needed (probably not — it's a protected page)
- Modify: `frontend/src/components/layout/Header.tsx` — add Insights to nav if missing
- Update: `docs/docs/frontend/components.md` — document Toast, OnboardingFlow
- Update: `docs/docs/api/` — document insights and streak endpoints
- Update: `CONTEXT.md` — session notes
- Update: `UPCOMING_FEATURES_AND_ROADMAP.md` — check off completed items

### Step 1: Add E2E mocks

In the `mockApiRequest` function in `api.ts`, add handlers:
```typescript
if (endpoint === '/api/insights') {
  return Promise.resolve({
    activity: { totalEncounters: 12, encountersThisMonth: 3, encountersByMonth: {}, protectionRate: 0.85, encounterTypeCounts: {}, protectionMethodCounts: {} },
    testing: { daysSinceLastTest: 14, testsThisYear: 3, conditionsCovered: 8, totalStandardConditions: 10, lastTestDate: '2026-02-17', coverageMap: {} },
    prevention: { prepAdherenceRate: 0.93, currentPrepStreakDays: 45, longestPrepStreakDays: 45, completedVaccines: ['HPV'], pendingVaccines: ['HEPATITIS_B'], activeReminders: 3 },
  } as T);
}

if (endpoint === '/api/medications/prep-streak') {
  return Promise.resolve({
    currentStreakDays: 45,
    longestStreakDays: 45,
    milestones: [
      { days: 7, labelKey: 'streaks.week', achieved: true },
      { days: 30, labelKey: 'streaks.month', achieved: true },
      { days: 90, labelKey: 'streaks.quarter', achieved: false },
    ],
  } as T);
}
```

### Step 2: Run full verification

```bash
cd frontend && npm run lint && npm test && npx tsc --noEmit && npm run build:full
cd ../backend && ./mvnw test
```

All must pass.

### Step 3: Update documentation

Update CONTEXT.md with Week 8 session notes.
Update relevant docs files.

### Step 4: Final commit

```bash
git add -A
git commit -m "feat: Week 8 complete — insights, onboarding, toasts, code splitting, PrEP streaks"
git push
```

---

## Dependency Order

```
Task 1 (Toast) ← foundation, do first
Task 2 (Code splitting) ← independent, can parallel with Task 1
Task 3 (Encounter fields backend) ← independent
Task 4 (Encounter fields frontend) ← depends on Task 3
Task 5 (Insights backend) ← depends on Task 3 (needs encounter types for protection rate)
Task 6 (Insights frontend) ← depends on Task 5
Task 7 (Onboarding) ← independent, can parallel
Task 8 (PrEP streak backend) ← independent
Task 9 (PrEP streak frontend) ← depends on Task 6 + Task 8
Task 10 (Integration) ← depends on all above
```

**Optimal parallel execution:**
- Wave 1: Tasks 1, 2, 3, 7, 8 (all independent)
- Wave 2: Tasks 4, 5 (depend on Task 3)
- Wave 3: Task 6 (depends on Task 5)
- Wave 4: Task 9 (depends on 6 + 8)
- Wave 5: Task 10 (final integration)
