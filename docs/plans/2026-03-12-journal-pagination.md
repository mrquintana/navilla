# Journal Pagination & Calendar Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pagination to journal timeline, year/month picker to calendar, move stats to top, and switch calendar to per-month fetching.

**Architecture:** New `/api/journal/months` endpoint returns all months with entries (powers picker + skip buttons). Existing `GET /api/journal` gains `page`/`size` params for timeline pagination (ignored when `month` param present). Frontend gets a `MonthYearPicker` popover component and pagination controls on timeline.

**Tech Stack:** Java 25 / Spring Boot 4.0.2 (Spring Data Pageable), React 19 / TypeScript / TailwindCSS, react-i18next

---

### Task 1: Backend — add months endpoint and paginated list

**Files:**
- Modify: `backend/src/main/java/app/navilla/repository/EncounterJournalRepository.java`
- Modify: `backend/src/main/java/app/navilla/service/EncounterJournalService.java`
- Modify: `backend/src/main/java/app/navilla/controller/EncounterJournalController.java`

**Step 1: Add repository queries**

In `EncounterJournalRepository.java`, add:

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
```

Add these methods:

```java
  @Query("SELECT DISTINCT FUNCTION('TO_CHAR', e.encounterDate, 'YYYY-MM') "
      + "FROM EncounterJournal e WHERE e.userHash = :userHash "
      + "ORDER BY 1")
  List<String> findDistinctMonthsByUserHash(@Param("userHash") String userHash);

  Page<EncounterJournal> findByUserHashOrderByEncounterDateDesc(String userHash, Pageable pageable);
```

Note: The existing `findByUserHashOrderByEncounterDateDesc(String)` stays for backward compatibility.

**Step 2: Add service methods**

In `EncounterJournalService.java`, add this method after `listEntries`:

```java
  @Transactional(readOnly = true)
  public List<String> getMonthsWithEntries(Jwt jwt) {
    String userHash = hashEmail(jwt);
    return journalRepository.findDistinctMonthsByUserHash(userHash);
  }
```

Update `listEntries` to support pagination. Change the method signature and body:

```java
  @Transactional(readOnly = true)
  public Object listEntries(Jwt jwt, String month, Integer page, Integer size) {
    String userHash = hashEmail(jwt);

    // Month filter — return all entries for that month (no pagination)
    if (month != null && !month.isBlank()) {
      YearMonth ym = YearMonth.parse(month);
      LocalDate startDate = ym.atDay(1);
      LocalDate endDate = ym.atEndOfMonth();
      List<EncounterJournal> entries = journalRepository.findByUserHashAndMonth(
          userHash, startDate, endDate);
      return entries.stream().map(e -> toResponse(e, userHash)).toList();
    }

    // Paginated — for timeline view
    if (page != null && size != null) {
      Page<EncounterJournal> pageResult = journalRepository
          .findByUserHashOrderByEncounterDateDesc(userHash,
              org.springframework.data.domain.PageRequest.of(page, size));
      return pageResult.map(e -> toResponse(e, userHash));
    }

    // Default — all entries (backward compat)
    List<EncounterJournal> entries = journalRepository
        .findByUserHashOrderByEncounterDateDesc(userHash);
    return entries.stream().map(e -> toResponse(e, userHash)).toList();
  }
```

**Step 3: Add controller endpoints**

In `EncounterJournalController.java`, update the list endpoint and add months endpoint:

```java
  @GetMapping
  public ResponseEntity<?> listEntries(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) String month,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size) {
    return ResponseEntity.ok(journalService.listEntries(jwt, month, page, size));
  }

  @GetMapping("/months")
  public ResponseEntity<List<String>> getMonthsWithEntries(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(journalService.getMonthsWithEntries(jwt));
  }
```

**Step 4: Run backend tests**

Run: `cd backend && ./mvnw test`
Expected: Some tests may fail due to changed `listEntries` signature — fix them by adding `null, null` for page/size params in test calls.

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/repository/EncounterJournalRepository.java \
  backend/src/main/java/app/navilla/service/EncounterJournalService.java \
  backend/src/main/java/app/navilla/controller/EncounterJournalController.java
git commit -m "feat: add /journal/months endpoint and paginated journal list"
git push
```

---

### Task 2: Backend tests for new functionality

**Files:**
- Modify: `backend/src/test/java/app/navilla/service/EncounterJournalServiceTest.java`
- Modify: `backend/src/test/java/app/navilla/controller/EncounterJournalControllerTest.java`

**Step 1: Fix existing tests**

Update all calls to `journalService.listEntries(jwt, month)` → `journalService.listEntries(jwt, month, null, null)` in `EncounterJournalServiceTest.java`.

Update the controller test's mock for `listEntries` to match the new 4-param signature.

**Step 2: Add test for getMonthsWithEntries**

In `EncounterJournalServiceTest.java`, add a nested class:

```java
  @Nested
  @DisplayName("getMonthsWithEntries")
  class GetMonthsWithEntries {

    @Test
    @DisplayName("returns distinct months")
    void returnsDistinctMonths() {
      stubAuth();
      List<String> months = List.of("2025-11", "2026-01", "2026-03");
      when(journalRepository.findDistinctMonthsByUserHash(USER_HASH)).thenReturn(months);

      List<String> result = encounterJournalService.getMonthsWithEntries(jwt);

      assertThat(result).containsExactly("2025-11", "2026-01", "2026-03");
    }
  }
```

**Step 3: Run tests**

Run: `cd backend && ./mvnw test`
Expected: All pass

**Step 4: Commit**

```bash
git add backend/src/test/
git commit -m "test: add journal months and pagination tests"
git push
```

---

### Task 3: Frontend — update API types and hooks

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/hooks/useJournal.ts`

**Step 1: Add API types and endpoints**

In `api.ts`, add a page response type near the journal types:

```typescript
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
```

Add the months endpoint to `api.journal`:

```typescript
    months: (token: string) =>
      fetchJson<string[]>(`${BASE}/journal/months`, { headers: authHeaders(token) }),
```

Add a paginated list method:

```typescript
    listPaginated: (token: string, page: number, size: number) =>
      fetchJson<PageResponse<JournalEntry>>(
        `${BASE}/journal?page=${page}&size=${size}`,
        { headers: authHeaders(token) }
      ),
```

**Step 2: Add hooks**

In `useJournal.ts`, add:

```typescript
export function useJournalMonths() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'months'],
    queryFn: () => api.journal.months(session!.access_token),
    enabled: !!session,
    staleTime: 60_000,
  });
}

export function useJournalEntriesPaginated(page: number, size: number = 20) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'list', 'page', page, size],
    queryFn: () => api.journal.listPaginated(session!.access_token, page, size),
    enabled: !!session,
    placeholderData: (prev) => prev, // keep previous page visible while loading next
  });
}
```

Update existing `useJournalEntries` to always pass a month param (for calendar):

```typescript
export function useJournalEntries(month?: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'list', month ?? 'all'],
    queryFn: () => api.journal.list(session!.access_token, month),
    enabled: !!session,
  });
}
```

**Step 3: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 4: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/hooks/useJournal.ts
git commit -m "feat: add journal months and paginated list hooks"
git push
```

---

### Task 4: Frontend — build MonthYearPicker component

**Files:**
- Create: `frontend/src/components/journal/MonthYearPicker.tsx`

**Step 1: Create the component**

Popover triggered by clicking the month label. Two views:
- **Year view**: List of years that have entries + current year. Click to select.
- **Month view**: 3×4 grid of month abbreviations. Months with entries are clickable (indigo text). Months without entries are greyed out/disabled. Click to navigate.

Props:
- `currentMonth: Date` — currently displayed month
- `monthsWithEntries: string[]` — array of "YYYY-MM" strings from the API
- `onNavigate: (year: number, month: number) => void` — callback when user selects
- `label: string` — the formatted month label to display as trigger

Component should:
- Derive available years from `monthsWithEntries`
- Always include the current year even if no entries
- Open to year view first, then month view after year selection
- Close on click outside or Escape
- Use Tailwind, match existing `input` and `btn` styling
- Keep under 150 lines

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 3: Commit**

```bash
git add frontend/src/components/journal/MonthYearPicker.tsx
git commit -m "feat: add MonthYearPicker popover component"
git push
```

---

### Task 5: Frontend — add Pagination component

**Files:**
- Create: `frontend/src/components/ui/Pagination.tsx`

**Step 1: Create the component**

Reusable pagination controls. Props:
- `currentPage: number` (0-indexed)
- `totalPages: number`
- `totalElements: number`
- `pageSize: number`
- `onPageChange: (page: number) => void`

Renders:
- "Showing 1-20 of 147" text
- Prev/Next buttons (disabled at boundaries)
- Page number buttons (show max 5, with ellipsis for large page counts)
- Compact on mobile (just prev/next + current page)

Keep under 80 lines. Use Tailwind.

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 3: Commit**

```bash
git add frontend/src/components/ui/Pagination.tsx
git commit -m "feat: add reusable Pagination component"
git push
```

---

### Task 6: Frontend — update JournalPage

**Files:**
- Modify: `frontend/src/pages/JournalPage.tsx`
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Add locale keys**

In `en_US.json` journal section, add:
```json
    "showingEntries": "Showing {{from}}-{{to}} of {{total}}",
    "pageLabel": "Page {{page}} of {{total}}",
    "prevPage": "Previous page",
    "nextPage": "Next page",
    "selectYear": "Select year",
    "selectMonth": "Select month"
```

In `es_MX.json` journal section, add corresponding Spanish translations:
```json
    "showingEntries": "Mostrando {{from}}-{{to}} de {{total}}",
    "pageLabel": "Página {{page}} de {{total}}",
    "prevPage": "Página anterior",
    "nextPage": "Página siguiente",
    "selectYear": "Seleccionar año",
    "selectMonth": "Seleccionar mes"
```

**Step 2: Update JournalPage**

Major changes:
1. **Move stats to top** — move the summary bar from below entry list to right under the page header (above view toggle)
2. **Timeline view** — switch from `useJournalEntries()` (all) to `useJournalEntriesPaginated(page)`. Add `Pagination` component below entries. Add `const [timelinePage, setTimelinePage] = useState(0)` state.
3. **Calendar view** — switch from `useJournalEntries()` (all) to `useJournalEntries(calendarMonthKey)` (per-month). Use `useJournalMonths()` for skip button logic and picker.
4. **Replace month label** with `MonthYearPicker` — the `calendarMonthLabel` span becomes a clickable picker trigger.
5. **`monthsWithEntries`** — derive from `useJournalMonths()` data instead of computing from all entries.
6. **Promotion logic** — keep using entries from current view (good enough approximation).

The key structural change: instead of one `useJournalEntries()` call, the page now uses:
- Timeline: `useJournalEntriesPaginated(timelinePage)`
- Calendar: `useJournalEntries(calendarMonthKey)` + `useJournalMonths()`

Both hooks can coexist — React Query caches them independently.

**Step 3: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 4: Commit**

```bash
git add frontend/src/pages/JournalPage.tsx frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: journal pagination, year/month picker, stats at top"
git push
```

---

### Task 7: Run full verification

**Step 1: Run backend tests**

Run: `cd backend && ./mvnw test`
Expected: All pass

**Step 2: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 3: Commit any fixes**
