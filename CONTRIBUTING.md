# Contributing to Navilla

Thank you for your interest in contributing to Navilla! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see [README.md](README.md))
4. Create a new branch for your work

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-connection-api` - New features
- `fix/health-status-validation` - Bug fixes
- `docs/update-api-reference` - Documentation
- `refactor/encryption-service` - Code refactoring

### Commit Messages

Write clear, concise commit messages:

```
Add connection request validation

- Validate that users cannot connect to themselves
- Add check for existing pending requests
- Include i18n error messages
```

- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 50 characters
- Add details in the body if needed

### Code Style

#### Java (Backend)

We use [Google Java Style](https://google.github.io/styleguide/javaguide.html) enforced by Checkstyle.

```bash
# Check style before committing
cd backend
./mvnw checkstyle:check
```

Key points:
- 2-space indentation
- 100-character line limit
- Javadoc on all public methods
- Use `final` for method parameters

#### TypeScript (Frontend)

We use ESLint with TypeScript support.

```bash
cd frontend
npm run lint
```

Key points:
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use explicit return types on functions
- Use React functional components with hooks

### Testing

#### Backend Tests

```bash
cd backend
./mvnw test
```

- Write unit tests for all services
- Use `@WebMvcTest` for controller tests
- Aim for 80%+ code coverage

#### Frontend Tests

```bash
cd frontend
npm test
```

- Test components with React Testing Library
- Mock API calls in tests
- Test error states and loading states

### Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks locally**:
   ```bash
   # Backend
   cd backend && ./mvnw clean verify

   # Frontend
   cd frontend && npm run lint && npm run build
   ```

3. **Create the Pull Request**:
   - Use a descriptive title
   - Fill out the PR template
   - Link related issues
   - Request review from maintainers

4. **Address review feedback**:
   - Respond to all comments
   - Push fixes as new commits (don't force-push during review)
   - Re-request review when ready

5. **Merge**:
   - PRs require at least one approval
   - All CI checks must pass
   - Squash merge is preferred for clean history

## Project Structure

```
navilla/
├── backend/           # Spring Boot API
│   ├── src/main/
│   │   ├── java/app/navilla/
│   │   │   ├── config/       # Configuration classes
│   │   │   ├── controller/   # REST controllers
│   │   │   ├── service/      # Business logic
│   │   │   ├── repository/   # Data access
│   │   │   ├── entity/       # JPA entities
│   │   │   ├── dto/          # Data transfer objects
│   │   │   └── security/     # Security utilities
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── messages*.properties  # i18n
│   └── src/test/     # Tests mirror main structure
│
├── frontend/         # React SPA
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API client code
│       ├── locales/      # i18n translation files
│       └── types/        # TypeScript types
│
└── docs/             # Documentation site
    └── docs/         # Markdown files
```

## Internationalization (i18n)

### Backend

Add messages to `src/main/resources/messages.properties`:

```properties
user.error.notFound=User not found.
```

Use in code:
```java
@Autowired
private MessageSource messageSource;

String message = messageSource.getMessage("user.error.notFound", null, locale);
```

### Frontend

Add translations to `src/locales/en_US.json`:

```json
{
  "user": {
    "notFound": "User not found"
  }
}
```

Use in components:
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <p>{t('user.notFound')}</p>;
}
```

## Security Guidelines

- Never commit secrets, API keys, or credentials
- Use environment variables for configuration
- Validate all user input
- Use parameterized queries (JPA handles this)
- Follow OWASP guidelines for web security

## Questions?

- Check the [documentation](docs/)
- Open a GitHub issue for bugs or feature requests
- Start a discussion for general questions

Thank you for contributing!
