---
sidebar_position: 15
title: Insights
---

# Insights API

A single endpoint that aggregates activity, testing, and prevention data for the authenticated user's personal insights dashboard. Requires authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights` | Get aggregated personal insights |

---

## Get Insights

Returns aggregated insights data across three sections: activity (encounter journal), testing (health log), and prevention (medications, vaccinations, reminders).

```
GET /api/insights
```

### Response (200 OK)

```json
{
  "activity": {
    "totalEncounters": 24,
    "encountersThisMonth": 3,
    "encountersByMonth": {
      "2026-01": 5,
      "2026-02": 8,
      "2026-03": 3
    },
    "protectionRate": 0.875,
    "encounterTypeCounts": {
      "oral": 18,
      "anal": 12,
      "vaginal": 2
    },
    "protectionMethodCounts": {
      "condom": 21,
      "prep": 15,
      "none": 3
    }
  },
  "testing": {
    "daysSinceLastTest": 15,
    "testsThisYear": 3,
    "conditionsCovered": 7,
    "totalStandardConditions": 10,
    "lastTestDate": "2026-03-01",
    "coverageMap": {
      "hiv": "NEGATIVE",
      "chlamydia": "NEGATIVE",
      "gonorrhea": "NEGATIVE",
      "syphilis": "NEGATIVE",
      "hsv1": "NOT_TESTED",
      "hsv2": "NOT_TESTED",
      "hpv": "NEGATIVE",
      "hepatitis_b": "NEGATIVE",
      "hepatitis_c": "NOT_TESTED",
      "trichomoniasis": "NEGATIVE"
    }
  },
  "prevention": {
    "prepAdherenceRate": 0.95,
    "currentPrepStreakDays": 45,
    "longestPrepStreakDays": 90,
    "completedVaccines": ["MPOX"],
    "pendingVaccines": ["HPV", "HEP_A"],
    "activeReminders": 3
  }
}
```

### Response Fields

#### Activity Summary

| Field | Type | Description |
|-------|------|-------------|
| `totalEncounters` | int | Total encounter count across all time |
| `encountersThisMonth` | int | Encounters in the current month |
| `encountersByMonth` | map | Monthly encounter counts (key: `YYYY-MM`) |
| `protectionRate` | double | Fraction of encounters with any protection method (0.0 to 1.0) |
| `encounterTypeCounts` | map | Count per encounter type |
| `protectionMethodCounts` | map | Count per protection method |

#### Testing Summary

| Field | Type | Description |
|-------|------|-------------|
| `daysSinceLastTest` | int | Days since the most recent test visit |
| `testsThisYear` | int | Total test visits in the current year |
| `conditionsCovered` | int | Number of distinct conditions tested |
| `totalStandardConditions` | int | Total number of standard condition types |
| `lastTestDate` | date | Date of most recent test visit |
| `coverageMap` | map | Latest status per condition (key: condition type, value: status or `NOT_TESTED`) |

#### Prevention Summary

| Field | Type | Description |
|-------|------|-------------|
| `prepAdherenceRate` | double | Current PrEP adherence rate (null if no PrEP medication) |
| `currentPrepStreakDays` | int | Current consecutive days of PrEP adherence |
| `longestPrepStreakDays` | int | Longest consecutive days of PrEP adherence |
| `completedVaccines` | string[] | Vaccine types with all doses completed |
| `pendingVaccines` | string[] | Vaccine types with doses remaining |
| `activeReminders` | int | Number of active, incomplete reminders |

:::note Privacy
Insights are computed entirely from the authenticated user's own data. No data from other users or connections is included. The response is cached for 5 minutes per user.
:::
