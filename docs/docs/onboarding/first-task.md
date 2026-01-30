---
sidebar_position: 3
title: First Task
---

# Your First Task

Guide to picking up and completing your first contribution.

## Finding a Task

1. Go to GitHub Issues
2. Filter by `good first issue` label
3. Pick one that interests you
4. Comment to claim it

## Before You Start

- [ ] Read the issue description fully
- [ ] Check linked issues/PRs for context
- [ ] Ask questions if anything is unclear
- [ ] Read related documentation

## Working on the Task

### 1. Create a Branch

```bash
git checkout -b feature/NAV-XXX-description
```

### 2. Write Code

Follow the [Code Style Guide](../development/code-style).

### 3. Write Tests

All new code should have tests. See [Testing Guide](../development/testing).

### 4. Update Documentation

If your change affects:
- API endpoints → Update API docs
- Configuration → Update setup docs
- Architecture → Update architecture docs

### 5. Create Pull Request

```bash
git push -u origin feature/NAV-XXX-description
```

Then create PR on GitHub with:
- Clear description of changes
- Link to issue
- Screenshots (if UI changes)
- Test evidence

## PR Checklist

Before requesting review:

- [ ] Tests pass locally
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No console.log or debug statements
- [ ] No hardcoded secrets or PII

## Getting Help

Stuck? Here's what to do:

1. Check documentation first
2. Search existing issues/PRs
3. Ask in team chat
4. Schedule pair programming session

## Example First Tasks

### Easy: Update documentation
- Fix typo in docs
- Add missing API example
- Improve setup instructions

### Medium: Add validation
- Add input validation to endpoint
- Add form validation to frontend
- Write tests for existing code

### Harder: New feature
- Implement new API endpoint
- Add new UI component
- Fix bug in exposure calculation
