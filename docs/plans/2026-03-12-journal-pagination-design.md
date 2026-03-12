# Journal Pagination & Calendar Navigation Design

**Goal:** Fix the scroll pain in the journal by adding pagination to timeline view, a year/month picker to calendar view, and moving stats to the top.

## Changes

### 1. New backend endpoint: `GET /api/journal/months`

Returns all months that have journal entries for the authenticated user.

**Response:** `["2025-08", "2025-11", "2026-01", "2026-02", "2026-03"]`

Lightweight query: `SELECT DISTINCT TO_CHAR(encounter_date, 'YYYY-MM') FROM encounter_journal WHERE user_hash = ? ORDER BY 1`

Powers: year/month picker, skip buttons, calendar per-month fetching.

### 2. Backend: paginated journal list

Add `page` and `size` query params to `GET /api/journal` (defaults: page=0, size=20).

**Response shape:**
```json
{
  "content": [...entries...],
  "totalElements": 147,
  "totalPages": 8,
  "number": 0,
  "size": 20
}
```

When `month` param is provided (calendar view), pagination is ignored — return all entries for that month (max ~30, bounded naturally).

### 3. Frontend: year/month picker popover

Clicking the month label (e.g. "March 2026") opens a popover with two steps:
- **Step 1 — Year list:** Shows years that have entries + current year. Years without entries are not shown.
- **Step 2 — Month grid:** 3×4 grid of month names. Months with entries are clickable (normal style). Months without entries are greyed out / disabled. Selecting a month navigates the calendar there and closes the popover.

Skip buttons (⏪⏩) remain — they use the months endpoint for sequential navigation.

### 4. Frontend: timeline pagination

Replace infinite scroll of all entries with page-based navigation:
- 20 entries per page
- Shows "Showing 1-20 of 147 entries"
- Prev/Next buttons + page number buttons
- Stays on page 1 when new entries are added (React Query refetch)

### 5. Frontend: stats moved to top

Move the summary bar ("This month: 5 | Year total: 42") from below the entry list to directly under the page header, above the view toggle.

### 6. Frontend: calendar fetches per-month only

`useJournalEntries(month)` passes the current calendar month to the API instead of loading everything. The months endpoint provides data for skip buttons and the picker.

## Files affected

**Backend:**
- `EncounterJournalController.java` — add `/months` endpoint, add Pageable to list
- `EncounterJournalService.java` — add `getMonthsWithEntries()`, update `listEntries()` for pagination
- `EncounterJournalRepository.java` — add months query, add paginated query

**Frontend:**
- `JournalPage.tsx` — year/month picker, pagination controls, stats moved to top, per-month fetching
- `hooks/useJournal.ts` — update hooks for pagination params and months endpoint
- `lib/api.ts` — add months endpoint, update list to accept page/size and return page shape
- `locales/en_US.json` + `es_MX.json` — new i18n keys

**Tests:**
- `EncounterJournalServiceTest.java` — test months query and paginated list
- `EncounterJournalControllerTest.java` — test new endpoint
