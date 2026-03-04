---
sidebar_position: 7
title: Catalog
---

# Catalog API

Public endpoints for retrieving configurable catalogs. No authentication required.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/catalog` | Get full health catalog (medications, frequencies, vaccines, encounter types) |
| GET | `/api/catalog/conditions` | Get active STI conditions |
| GET | `/api/catalog/stages` | Get network constellation stages |

## Get Full Health Catalog

Returns the complete health catalog including medication types, frequencies, vaccine series, encounter types, and protection methods. Cached for 1 hour.

```
GET /api/catalog
```

### Response (200 OK)

```json
{
  "medicationTypes": {
    "PREP": { "labelKey": "medication.type.prep", "defaultFrequency": "DAILY", "ongoing": true },
    "PEP": { "labelKey": "medication.type.pep", "defaultFrequency": "DAILY", "ongoing": false }
  },
  "frequencies": {
    "DAILY": { "hours": 24, "days": 1 },
    "WEEKLY": { "hours": 168, "days": 7 }
  },
  "vaccineSeries": {
    "HPV": { "labelKey": "vaccine.series.hpv", "totalDoses": 3, "doseIntervalsDays": [0, 60, 180] }
  },
  "encounterTypes": ["ORAL", "ANAL", "VAGINAL", "MANUAL", "OTHER"],
  "protectionMethods": ["CONDOM", "INTERNAL_CONDOM", "PREP", "PEP", "DENTAL_DAM", "NONE", "OTHER"]
}
```

## Get Active Conditions

Returns all active STI conditions from the database-driven catalog, sorted by `displayOrder`.

```
GET /api/catalog/conditions
```

### Response (200 OK)

```json
[
  {
    "code": "CHLAMYDIA",
    "displayName": "Chlamydia",
    "displayNameEs": "Clamidia",
    "description": null,
    "descriptionEs": null,
    "icon": null,
    "displayOrder": 1
  },
  {
    "code": "GONORRHEA",
    "displayName": "Gonorrhea",
    "displayNameEs": "Gonorrea",
    "description": null,
    "descriptionEs": null,
    "icon": null,
    "displayOrder": 2
  }
]
```

### Available Conditions

| Code | English | Spanish | Order |
|------|---------|---------|-------|
| `CHLAMYDIA` | Chlamydia | Clamidia | 1 |
| `GONORRHEA` | Gonorrhea | Gonorrea | 2 |
| `SYPHILIS` | Syphilis | Sífilis | 3 |
| `HIV` | HIV | VIH | 4 |
| `HSV1` | HSV-1 (Oral Herpes) | VHS-1 (Herpes Oral) | 5 |
| `HSV2` | HSV-2 (Genital Herpes) | VHS-2 (Herpes Genital) | 6 |
| `HPV` | HPV | VPH | 7 |
| `HEPATITIS_B` | Hepatitis B | Hepatitis B | 8 |
| `HEPATITIS_C` | Hepatitis C | Hepatitis C | 9 |
| `TRICHOMONIASIS` | Trichomoniasis | Tricomoniasis | 10 |

:::note Configurability
Conditions are stored in the `condition_catalog` table. New conditions can be added, existing ones deactivated, and display order changed — all without redeployment. The old `ConditionType` enum is deprecated.
:::

## Get Network Stages

Returns all network constellation stages with their node count thresholds.

```
GET /api/catalog/stages
```

### Response (200 OK)

```json
[
  {
    "code": "EMPTY_SKY",
    "displayName": "Empty Sky",
    "displayNameEs": "Cielo Vacío",
    "minNodes": 0,
    "maxNodes": 0,
    "description": null,
    "descriptionEs": null
  },
  {
    "code": "SPARK",
    "displayName": "Spark",
    "displayNameEs": "Chispa",
    "minNodes": 1,
    "maxNodes": 50,
    "description": null,
    "descriptionEs": null
  }
]
```

### Stage Thresholds

| Code | Name | Min Nodes | Max Nodes |
|------|------|-----------|-----------|
| `EMPTY_SKY` | Empty Sky | 0 | 0 |
| `SPARK` | Spark | 1 | 50 |
| `CLUSTER` | Cluster | 51 | 500 |
| `CONSTELLATION` | Constellation | 501 | 2,000 |
| `GALAXY` | Galaxy | 2,001 | 10,000 |
| `SUPERCLUSTER` | Supercluster | 10,001 | ∞ (null) |

:::note Configurability
Stages are stored in the `network_stages` table. Thresholds, names, and translations can be adjusted without redeployment.
:::
