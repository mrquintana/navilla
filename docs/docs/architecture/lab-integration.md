---
title: Lab Integration Framework
sidebar_label: Lab Integration
---

# Lab Integration Framework

Navilla's lab integration framework allows users to verify their test results directly with laboratory providers. The architecture is pluggable — adding a new lab provider requires only a single Java class and a YAML configuration entry.

## Architecture

### LabProvider Interface

Every lab integration implements the `LabProvider` interface:

```java
public interface LabProvider {
    String getCode();
    LabProviderConfig getConfig();
    LabFetchResult fetchResults(Map<String, String> visitCredentials,
                                Map<String, String> labCredentials);
}
```

- **`getCode()`** — unique identifier for the provider (e.g., `DEMO_MX`, `EXPRESS_MX`)
- **`getConfig()`** — returns metadata including display names (English/Spanish) and required input fields
- **`fetchResults()`** — calls the external lab API and returns parsed results

### Data Flow

```
User clicks "Verify with lab"
  → LabVerificationModal (React)
    → POST /api/labs/verify
      → LabVerificationService.verify()
        → LabProvider.fetchResults()
          → External Lab API (HTTPS)
        ← LabFetchResult (parsed results)
      ← LabVerifyResponse (results for review)
    → User reviews results → clicks Confirm
    → POST /api/labs/confirm
      → LabVerificationService.confirm()
        → Updates TestVisit.verified = true
        → Stores individual test results
      ← Success
```

### Provider Registration

Providers are Spring beans discovered automatically via `@Component`. The `LabVerificationService` collects all `LabProvider` beans at startup and indexes them by code.

### Configuration

Each provider can read external configuration from `application.yml`:

```yaml
navilla:
  labs:
    demo-mx:
      enabled: true
      base-url: https://mock-lab-api.example.com
    express-mx:
      enabled: true
      base-url: https://express-lab-api.example.com
```

## Adding a New Lab Provider

1. **Create the provider class** implementing `LabProvider`:

```java
@Component
public class MyNewLabProvider implements LabProvider {
    @Override
    public String getCode() { return "MY_NEW_LAB"; }

    @Override
    public LabProviderConfig getConfig() {
        return new LabProviderConfig(
            "MY_NEW_LAB",
            "My New Lab",
            "Mi Nuevo Laboratorio",
            List.of(new LabFieldConfig("orderId", "Order ID", "ID de Orden"))
        );
    }

    @Override
    public LabFetchResult fetchResults(Map<String, String> visitCredentials,
                                        Map<String, String> labCredentials) {
        // Call the lab's API, parse results, return LabFetchResult
    }
}
```

2. **Add YAML config** (if needed) under `navilla.labs.my-new-lab`

3. **Done** — the provider is automatically discovered and listed in `GET /api/labs/providers`

## Existing Providers

| Code | Name | Description |
|------|------|-------------|
| `DEMO_MX` | Demo Lab Mexico | Mock provider for development and testing |
| `EXPRESS_MX` | Express Lab Mexico | Mock provider simulating a quick-results lab |

## Security Considerations

- Lab credentials are never stored permanently — they are used only for the duration of the verification request
- All communication with lab APIs uses HTTPS
- Results are shown to the user for explicit confirmation before being saved
- The verification status (`verified = true`) is stored on the `TestVisit` entity
