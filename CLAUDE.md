# Claude Code Project Instructions

## Commit Preferences

- **No Co-Authored-By signature** - Do not add "Co-Authored-By: Claude" lines to commits
- **Commit frequently** - After completing 3-5 related changes or every 15-20 minutes of work, commit and push
- **Don't accumulate changes** - Large uncommitted changesets are risky. Commit early and often
- **Push after commit** - Always push to remote after committing to keep AWS environment up-to-date

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

### 3. GitHub Issues (Required for milestones)
- **All milestones must be tracked as GitHub issues**
- Close completed issues with `gh issue close <number> --comment "details"`
- Add comments on progress with `gh issue comment <number> -b "message"`
- Create new issues for discovered work/next milestones with `gh issue create`
- Check open issues before starting work: `gh issue list`
- Use labels: `backend`, `frontend`, `phase-2`, `enhancement`

### 4. Locale Files (For UI text changes)
- Update both locale files when adding UI text:
  - `frontend/src/locales/en_US.json`
  - `frontend/src/locales/es_MX.json` (Spanish translations or English placeholders)

### 5. Tests (Required for code changes)
- **All new code must have unit and integration tests**
- Run backend tests: `cd backend && ./mvnw test`
- Run frontend build: `cd frontend && npm run build`
- Backend test locations:
  - Unit tests: `backend/src/test/java/app/navilla/service/`
  - Integration tests: `backend/src/test/java/app/navilla/controller/`

### 6. Postman Collection (For API changes)
- Update Postman collection when adding/modifying API endpoints
- Location: `docs/static/postman/navilla-api.postman_collection.json`

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

## Testing Requirements

### Before Every Commit (Required)
- **Run local tests before committing** - Never commit without verifying tests pass
- Frontend: `cd frontend && npm run build && npm run lint`
- Backend: `cd backend && ./mvnw test`
- Fix any errors before committing

### E2E Testing
- E2E tests run on AWS environment after deployment
- Run with: `cd frontend && npm run test:e2e`

## Project Context
- Main tracking file: `/CONTEXT.md`
- Documentation site: `/docs` (Docusaurus)
- Backend: Java 25 + Spring Boot 4.0.2
- Frontend: React 19 + Vite + TypeScript + TailwindCSS
- Auth: Supabase Auth
- Email: SendGrid (SMTP via Supabase)
- Hosting: AWS
- i18n: react-i18next (en_US, es_MX)
