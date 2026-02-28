# Input Constraints Reference

Every text field in the API has a maximum length enforced on both the backend (`@Size` validation) and frontend (`maxLength` attribute). Requests exceeding these limits are rejected with a 400 Bad Request.

## Standard Limits

| Field Type | Max Length | Used In |
|---|---|---|
| Email address | 254 | Login, Signup, Connections |
| Password | 128 | Login, Signup, Reset |
| Partner alias / name | 200 | Journal entries, Partners |
| Display name | 100 | Profile |
| Full name | 200 | Profile, Signup |
| Username | 30 | Profile, Signup |
| Location | 150 | Profile, Signup |
| Notes (journal, partner, test visit) | 5,000 | Journal entries, Partners, Test visits |
| Custom field label | 100 | Journal entries |
| Custom field value | 500 | Journal entries |
| Lab name / provider | 200 | Labs |
| Lab reference number | 200 | Test visits |
| Lab credential key | 100 | Lab credentials |
| Lab credential value | 500 | Lab credentials |
| Condition type / status | 50 | Health status, Test results |
| Custom condition name | 200 | Test results |
| Result value / reference range | 200 | Test results |
| Profile visibility | 20 | Profile |
| Sex | 20 | Profile |
| Avatar keys | 500 | Profile |
| Confirmation text (delete) | 50 | Partner delete, Account delete |

## Array Limits

| Collection | Max Items |
|---|---|
| Custom fields per entry | 3 |
| Test results per visit | 20 |
| Lab credentials per lab | 10 |
| Journal template labels | 3 |

## Enforcement

### Backend (Spring Boot)

All request DTOs use Jakarta Validation annotations:

```java
public record CreatePartnerRequest(
    @NotBlank @Size(max = 200) String alias,
    @Size(max = 5000) String notes
) {}
```

Nested objects use `@Valid` to cascade validation:

```java
public record CreateLabRequest(
    @NotBlank @Size(max = 200) String provider,
    @NotBlank @Size(max = 200) String name,
    @Valid @Size(max = 10) List<LabCredentialDto> credentials
) {}
```

Controllers apply `@Valid` on all `@RequestBody` parameters.

### Frontend (React)

All text inputs and textareas include `maxLength`:

```tsx
<input type="text" maxLength={200} ... />
<textarea maxLength={5000} ... />
```

## Adding New Fields

When adding a new text field anywhere in the app:

1. **Backend DTO**: Add `@Size(max = N)` to the field. Use `@NotBlank` if required.
2. **Frontend input**: Add `maxLength={N}` to the `<input>` or `<textarea>`.
3. **Update this document** with the new field and its limit.
4. **Keep both sides in sync** — the frontend limit should match the backend limit.
