# Checkstyle Guidance (Navilla)

This project enforces **Google Java Style** via Checkstyle. These notes are a quick, practical checklist to avoid common violations while coding.

## Import Order
- Keep imports in **lexicographical order** within their group.
- Standard order (as enforced here):
  1. `java.*`
  2. `javax.*`
  3. `org.*`
  4. `com.*`
  5. Project (`app.navilla.*`)
- Avoid unused imports.
- Keep static imports grouped and ordered.

## Spacing & Empty Lines
- Ensure a **blank line** between method definitions where required.
- Avoid extra blank lines inside blocks.

## Javadoc
- **All public classes, records, and methods** should have Javadoc.
- For services/controllers, include a brief purpose + params/returns.
- Keep comments concise; focus on intent, not restating code.

## Final Class Rule
- If Checkstyle asks for `final`, mark the class as `final`.

## Common Triggers to Watch
- Import ordering (especially `org.springframework.*`)
- Missing Javadoc on new classes/methods
- Empty line separation between methods
- New helper classes inside services (often need `final`)

## Quick Sanity Check
Before committing:
- Run `./mvnw checkstyle:check`
- Fix import order first (usually quick)
- Add missing Javadocs for new types/methods

---

If a Checkstyle error shows up, scan the file for these first—most violations come from these rules.
