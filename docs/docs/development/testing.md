---
sidebar_position: 3
title: Testing
---

# Testing Guide

## Backend Testing

### Unit Tests

```java
@Test
void shouldCalculateExposureForDirectConnection() {
    // Given
    var userHash = "user123";
    var connectionHash = "conn456";
    when(connectionRepo.findConfirmedConnections(userHash))
        .thenReturn(List.of(createConnection(userHash, connectionHash)));
    when(healthRepo.findByUserHash(connectionHash))
        .thenReturn(Optional.of(createPositiveStatus("hiv")));

    // When
    var exposure = exposureService.calculateExposure(userHash);

    // Then
    assertThat(exposure.getExposures()).hasSize(1);
    assertThat(exposure.getExposures().get(0).getDegree()).isEqualTo(1);
}
```

### Integration Tests

```java
@SpringBootTest
@Testcontainers
class ConnectionControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Test
    void shouldCreateConnection() {
        // Test full flow with real database
    }
}
```

### Running Tests

```bash
# All tests
./gradlew test

# Specific test class
./gradlew test --tests ConnectionServiceTest

# With coverage
./gradlew test jacocoTestReport
```

## Frontend Testing

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';

test('renders exposure count', () => {
  render(<ExposureCard exposures={mockExposures} />);
  expect(screen.getByText('2 potential exposures')).toBeInTheDocument();
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Test Coverage Requirements

| Area | Minimum Coverage |
|------|------------------|
| Services | 80% |
| Controllers | 70% |
| Repositories | 60% |
| Frontend | 70% |
