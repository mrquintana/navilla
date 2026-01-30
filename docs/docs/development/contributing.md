---
sidebar_position: 1
title: Contributing
---

# Contributing to Navilla

Guidelines for contributing to the Navilla project.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Set up development environment (see [Setup Guide](../getting-started/setup))
4. Create a feature branch

## Branch Naming

```
feature/NAV-123-add-connection-request
bugfix/NAV-456-fix-exposure-calculation
hotfix/NAV-789-security-patch
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(connections): add connection request endpoint
fix(exposure): correct degree calculation for cycles
docs(api): add connection endpoints documentation
test(health): add health status service tests
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review from maintainers
4. Squash commits before merge

## Code Review Guidelines

### What Reviewers Look For

- [ ] Code correctness
- [ ] Security considerations
- [ ] Privacy implications
- [ ] Test coverage
- [ ] Documentation updates

### Privacy Checklist

Before submitting changes that touch user data:

- [ ] No PII logged
- [ ] Data encrypted appropriately
- [ ] RLS policies updated if needed
- [ ] Minimum threshold logic preserved
