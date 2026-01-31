# Claude Code Project Instructions

## Commit Preferences

- **No Co-Authored-By signature** - Do not add "Co-Authored-By: Claude" lines to commits

## Post-Implementation Checklist

After completing any significant work, **always update the following**:

### 1. CONTEXT.md (Required)
- Add session notes with what was accomplished
- Update Progress Tracker checkboxes
- Update "Next Steps" section
- Add any new decisions to Decision Log
- Update Project Structure if new directories/files added

### 2. Documentation in /docs (Required for feature work)
- Update relevant docs in `docs/docs/` for any:
  - New components → `docs/docs/frontend/components.md`
  - New API endpoints → `docs/docs/api/`
  - Architecture changes → `docs/docs/architecture/`
  - New hooks/contexts → `docs/docs/frontend/state-management.md`
  - Project structure changes → `docs/docs/frontend/project-structure.md`

### 3. GitHub Issues (When applicable)
- Close completed issues with `gh issue close <number>`
- Add comments on progress with `gh issue comment <number> -b "message"`
- Create new issues for discovered work with `gh issue create`
- Check open issues: `gh issue list`

### 4. Locale Files (For UI text changes)
- Update both locale files when adding UI text:
  - `frontend/src/locales/en_US.json`
  - `frontend/src/locales/es_MX.json` (Spanish translations or English placeholders)

### 5. Tests (For code changes)
- Run backend tests: `cd backend && ./mvnw test`
- Run frontend build: `cd frontend && npm run build`

## Quick Reference

```bash
# Check open GitHub issues
gh issue list

# Close an issue
gh issue close <number> --comment "Completed in session"

# View issue details
gh issue view <number>

# Create new issue
gh issue create --title "Title" --body "Description"
```

## Project Context
- Main tracking file: `/CONTEXT.md`
- Documentation site: `/docs` (Docusaurus)
- Backend: Java 25 + Spring Boot 4.0.2
- Frontend: React 19 + Vite + TypeScript + TailwindCSS
- Auth: Supabase Auth
- i18n: react-i18next (en_US, es_MX)
