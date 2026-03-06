---
title: Lab Verification API
sidebar_label: Lab Verification
---

# Lab Verification API

Endpoints for verifying test results with external laboratory providers.

All endpoints require authentication via Bearer token.

## GET /api/labs/providers

Returns the list of enabled lab providers and their required input fields.

### Response

```json
[
  {
    "code": "DEMO_MX",
    "name": "Demo Lab Mexico",
    "nameEs": "Laboratorio Demo México",
    "requiredFields": [
      {
        "key": "orderId",
        "label": "Order ID",
        "labelEs": "ID de Orden"
      },
      {
        "key": "dateOfBirth",
        "label": "Date of Birth",
        "labelEs": "Fecha de Nacimiento"
      }
    ]
  }
]
```

## POST /api/labs/verify

Sends credentials to a lab provider and retrieves test results for review. Results are **not** saved until confirmed.

### Request

```json
{
  "visitId": "uuid-of-test-visit",
  "labCode": "DEMO_MX",
  "visitCredentials": {
    "orderId": "ORD-12345",
    "dateOfBirth": "1990-01-15"
  },
  "labCredentials": {}
}
```

### Response (Success)

```json
{
  "success": true,
  "results": [
    {
      "patientName": "Juan Garcia",
      "testDate": "2026-03-01",
      "conditionCode": "HIV",
      "result": "NEGATIVE",
      "resultValue": null,
      "referenceRange": null,
      "labReferenceId": "LAB-REF-001"
    },
    {
      "patientName": "Juan Garcia",
      "testDate": "2026-03-01",
      "conditionCode": "SYPHILIS",
      "result": "NEGATIVE",
      "resultValue": "0.2",
      "referenceRange": "<1.0",
      "labReferenceId": "LAB-REF-002"
    }
  ]
}
```

### Response (Error)

```json
{
  "success": false,
  "errorCode": "ORDER_NOT_FOUND",
  "errorMessage": "No order found with the provided credentials"
}
```

**Error codes:**
- `ORDER_NOT_FOUND` — credentials did not match any lab order
- `CONNECTION_ERROR` — could not reach the lab's API
- `INVALID_CREDENTIALS` — credentials were rejected by the lab
- `PROVIDER_ERROR` — unexpected error from the lab provider

## POST /api/labs/confirm

Saves the verified results to the test visit and marks it as lab-verified.

### Request

```json
{
  "visitId": "uuid-of-test-visit"
}
```

### Response

```json
{
  "success": true
}
```

After confirmation:
- The `TestVisit.verified` field is set to `true`
- The `TestVisit.verifiedAt` timestamp is recorded
- Individual test results are stored/updated on the visit
