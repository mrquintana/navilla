# Connections Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add server-side pagination (page size 10) with search to the confirmed connections endpoint and update the frontend to use it.

**Architecture:** Add a `Pageable` query to `ConnectionRepository`, a new paginated service method in `ConnectionService`, update the controller to accept `?page=0&size=10&search=` params, and swap the frontend from fetching all confirmed to paginated fetches with page controls. Keep the old `getConfirmedConnections()` as-is (used by other services) and add a new `getConfirmedConnectionsPaged()` method.

**Tech Stack:** Spring Data JPA `Pageable`/`Page`, React Query with page-keyed queries, existing `ConnectionList` component.

---

### Task 1: Add paginated repository query

**Files:**
- Modify: `backend/src/main/java/app/navilla/repository/ConnectionRepository.java`

**Step 1: Add the paginated query method**

Add this import and method to `ConnectionRepository`:

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
```

```java
@Query("SELECT c FROM Connection c WHERE (c.requesterHash = :userHash OR c.recipientHash = :userHash) "
    + "AND c.status = 'CONFIRMED' ORDER BY c.confirmedAt DESC")
Page<Connection> findConfirmedByUserHashPaged(@Param("userHash") String userHash, Pageable pageable);
```

**Step 2: Run tests to verify nothing breaks**

Run: `cd backend && ./mvnw test -pl . -Dtest=ConnectionServiceTest -q`
Expected: All existing tests still pass (new method is additive).

**Step 3: Commit**

```
feat: add paginated confirmed connections repository query
```

---

### Task 2: Add paginated service method

**Files:**
- Modify: `backend/src/main/java/app/navilla/service/ConnectionService.java`
- Test: `backend/src/test/java/app/navilla/service/ConnectionServiceTest.java`

**Step 1: Write the failing test**

Add to `ConnectionServiceTest.java`:

```java
@Test
@DisplayName("getConfirmedConnectionsPaged returns paginated results")
void getConfirmedConnectionsPaged_returnsPaginatedResults() {
  when(jwt.getClaimAsString("email")).thenReturn("user@test.com");
  when(encryptionService.hashEmail("user@test.com")).thenReturn(USER_HASH);

  Connection conn = new Connection();
  conn.setId(UUID.randomUUID());
  conn.setRequesterHash(USER_HASH);
  conn.setRecipientHash("other_hash");
  conn.setStatus(ConnectionStatus.CONFIRMED);
  conn.setRequestedAt(OffsetDateTime.now());
  conn.setConfirmedAt(OffsetDateTime.now());

  Page<Connection> page = new org.springframework.data.domain.PageImpl<>(
      List.of(conn), PageRequest.of(0, 10), 1);
  when(connectionRepository.findConfirmedByUserHashPaged(USER_HASH, PageRequest.of(0, 10)))
      .thenReturn(page);
  when(userRepository.findByEmailHashIn(any())).thenReturn(List.of());

  Page<ConnectionResponse> result = connectionService.getConfirmedConnectionsPaged(jwt, 0, 10, null);

  assertThat(result.getContent()).hasSize(1);
  assertThat(result.getTotalElements()).isEqualTo(1);
  assertThat(result.getNumber()).isEqualTo(0);
}
```

Add the necessary imports:
```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
```

**Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw test -pl . -Dtest="ConnectionServiceTest#getConfirmedConnectionsPaged_returnsPaginatedResults" -q`
Expected: FAIL — method doesn't exist yet.

**Step 3: Implement the paginated method in ConnectionService**

Add to `ConnectionService.java`:

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
```

```java
/**
 * Gets confirmed connections for the current user with server-side pagination and optional search.
 *
 * @param jwt the JWT token of the user
 * @param page zero-based page number
 * @param size page size
 * @param search optional search term to filter by partner name or username
 * @return paginated confirmed connections
 */
@Transactional(readOnly = true)
public Page<ConnectionResponse> getConfirmedConnectionsPaged(Jwt jwt, int page, int size, String search) {
  String email = jwt.getClaimAsString("email");
  String userHash = encryptionService.hashEmail(email);

  Page<Connection> connectionPage = connectionRepository.findConfirmedByUserHashPaged(
      userHash, PageRequest.of(page, size));

  Map<String, User> userLookup = fetchPartnerUsers(connectionPage.getContent(), userHash);

  List<ConnectionResponse> responses = connectionPage.getContent().stream()
      .map(c -> toConnectionResponse(c, userHash, userLookup))
      .toList();

  if (search != null && !search.isBlank()) {
    String query = search.trim().toLowerCase();
    List<ConnectionResponse> filtered = responses.stream()
        .filter(r -> {
          String displayName = r.partnerDisplayName() != null ? r.partnerDisplayName().toLowerCase() : "";
          String username = r.partnerUsername() != null ? r.partnerUsername().toLowerCase() : "";
          return displayName.contains(query) || username.contains(query);
        })
        .toList();
    return new PageImpl<>(filtered, connectionPage.getPageable(), connectionPage.getTotalElements());
  }

  return new PageImpl<>(responses, connectionPage.getPageable(), connectionPage.getTotalElements());
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && ./mvnw test -pl . -Dtest="ConnectionServiceTest#getConfirmedConnectionsPaged_returnsPaginatedResults" -q`
Expected: PASS

**Step 5: Commit**

```
feat: add paginated getConfirmedConnectionsPaged service method
```

---

### Task 3: Add paginated controller endpoint

**Files:**
- Modify: `backend/src/main/java/app/navilla/controller/ConnectionController.java`
- Test: `backend/src/test/java/app/navilla/controller/ConnectionControllerTest.java`

**Step 1: Write the failing test**

Add to `ConnectionControllerTest.java` a test that calls `GET /api/connections/confirmed?page=0&size=10` and expects a paginated JSON response with `content`, `totalElements`, `totalPages`, `number` fields.

Look at the existing test patterns in the file to match conventions (mock setup, JWT helper, etc.).

**Step 2: Run test to verify it fails**

**Step 3: Update the controller endpoint**

Replace the existing `getConfirmedConnections` method:

```java
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.RequestParam;
```

```java
@GetMapping("/confirmed")
public ResponseEntity<Page<ConnectionResponse>> getConfirmedConnections(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(required = false) String search) {

  Page<ConnectionResponse> connections = connectionService.getConfirmedConnectionsPaged(jwt, page, size, search);
  return ResponseEntity.ok(connections);
}
```

**Step 4: Run all connection tests**

Run: `cd backend && ./mvnw test -pl . -Dtest="ConnectionControllerTest,ConnectionServiceTest" -q`
Expected: All pass.

**Step 5: Commit**

```
feat: update /api/connections/confirmed to support pagination params
```

---

### Task 4: Update frontend API client

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Step 1: Add the paginated response type and update the confirmed method**

Add a generic `PageResponse` type near the existing types:

```typescript
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
```

Update the `confirmed` method in the `connections` object:

```typescript
confirmed: (token: string, page = 0, size = 10, search?: string) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set('search', search);
  return apiRequest<PageResponse<Connection>>(`/api/connections/confirmed?${params}`, token);
},
```

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean.

**Step 3: Commit**

```
feat: update frontend API client for paginated confirmed connections
```

---

### Task 5: Update ConnectionsPage with server-side pagination

**Files:**
- Modify: `frontend/src/pages/ConnectionsPage.tsx`
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Replace the confirmed query and add page controls**

In `ConnectionsPage.tsx`:

1. Add state for confirmed page:
```typescript
const [confirmedPage, setConfirmedPage] = useState(0);
```

2. Replace the `confirmedQuery` to use paginated API:
```typescript
const confirmedQuery = useQuery({
  queryKey: ['connections', 'confirmed', confirmedPage, confirmedSearch],
  queryFn: () => api.connections.confirmed(token, confirmedPage, 10, confirmedSearch || undefined),
  enabled: !!token,
  placeholderData: (prev) => prev,
});
```

3. Replace the `confirmedConnections` and `filteredConfirmed` memos with:
```typescript
const confirmedData = confirmedQuery.data;
const confirmedConnections = confirmedData?.content ?? [];
```

4. Remove the old `filteredConfirmed` useMemo entirely — search is now server-side.

5. Update the search input `onChange` to reset page:
```typescript
onChange={(e) => {
  setConfirmedSearch(e.target.value);
  setConfirmedPage(0);
}}
```

6. Pass `confirmedConnections` (not `filteredConfirmed`) to the ConnectionList `connections` prop.

7. Add a `footer` prop to the confirmed `ConnectionList` with page controls:
```tsx
footer={confirmedData && confirmedData.totalPages > 1 ? (
  <div className="flex items-center justify-between text-xs text-muted mt-4">
    <span>{t('common.page')} {confirmedData.number + 1} {t('common.of')} {confirmedData.totalPages}</span>
    <div className="flex gap-2">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setConfirmedPage((p) => Math.max(0, p - 1))}
        disabled={confirmedData.first}
      >
        {t('common.back')}
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setConfirmedPage((p) => p + 1)}
        disabled={confirmedData.last}
      >
        {t('common.next')}
      </button>
    </div>
  </div>
) : null}
```

8. Import `PageResponse` from `'../lib/api'`.

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean.

**Step 3: Run backend tests**

Run: `cd backend && ./mvnw test -q`
Expected: All pass.

**Step 4: Commit**

```
feat: wire up server-side pagination for confirmed connections
```

---

### Task 6: Final verification and cleanup

**Step 1: Run full backend test suite**

Run: `cd backend && ./mvnw test -q`
Expected: All pass.

**Step 2: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: Clean.

**Step 3: Manual verification checklist**

- [ ] `/connections` page loads without errors
- [ ] Confirmed connections show 10 per page
- [ ] Page controls appear when >10 confirmed connections
- [ ] Search filters across all confirmed (not just current page)
- [ ] Pending incoming/sent still work unchanged
- [ ] Remove connection still works and refreshes the list

**Step 4: Commit and push**

```
chore: connections pagination — final verification
```
