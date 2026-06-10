# instanceCreate.md

## Role

You are a Senior QA Automation Engineer specialized in Cypress API automation testing.

Your task is to generate clean, reusable, scalable Cypress API test cases for the "Create Instance" endpoint.

---

# API Details

## Endpoint

POST `/api/sites/{site}/instances`

---

# Payload Structure

```json
{
  "title": "string",
  "message": "string",
  "primary_color": "string",
  "secondary_color": "string",
  "display_logo": true,
  "layout": "string"
}
```

---

# Validation Rules

## title
- Required
- Minimum length: 1
- Maximum length: 255
- Accepts:
  - normal strings
  - special characters
  - JS script text
  - SQL injection text
  - traversal path text
- Reject:
  - integer
  - very large character set
  - long integer

---

## message
- Required
- Minimum length: 1
- Accepts:
  - large text
  - special characters
  - JS script text
  - SQL injection text
  - traversal path text
- Reject:
  - integer
  - empty

---

## primary_color
- Required
- Must accept ONLY hash color code format

Example:
```text
#121212
```

Reject:
- invalid strings
- empty
- integer
- long charset
- long integer
- JS script
- SQL injection
- special characters
- traversal path

---

## secondary_color
- Required
- Must accept ONLY hash color code format

Example:
```text
#FFFFFF
```

Reject:
- invalid strings
- empty
- integer
- long charset
- long integer
- JS script
- SQL injection
- special characters
- traversal path

---

## display_logo
- Required
- Accepts:
  - true
  - false

Reject:
- empty
- string
- integer except boolean equivalent
- long charset
- long integer
- JS script
- SQL injection
- special characters
- traversal path

---

## layout
- Required
- Accepts valid layout values only (theme tag)

Reject:
- empty
- invalid integer
- invalid string
- long charset
- long integer
- JS script
- SQL injection
- special characters
- traversal path

---

# Site Validation

Reject request when:
- site id does not exist
- site id belongs to another reseller
- deleted site id used
- empty site id used

Expected status code:
```text
404
```

---

# Expected Response Codes

| Scenario | Expected Status |
|---|---|
| Successful creation | 200 |
| Validation failure | 417 |
| Invalid site | 404 |
| Missing primary color | 418 |

---

# Cypress Framework Requirements

## Tech Stack
- Cypress
- JavaScript
- API testing only

---

# Folder Structure

```text
cypress/
  e2e/
    api/
      instances/
        createInstance.cy.js

  fixtures/
    instances/
      createInstancePayloads.js

  support/
    api/
      instanceApi.js
```

---

# Code Architecture Requirements

## Reusable API Methods

Create reusable helper methods like:

```javascript
createInstance(siteId, payload)
```

Use `cy.request()`.

---

## Fixtures

Move reusable payloads into fixture/helper files.

---

## Test Design

Generate:
- positive test cases
- negative test cases
- boundary value tests
- security payload tests
- validation tests

---

## Assertions

Validate:
- status code
- response body
- validation message
- response schema if possible

---

## Coding Standards

Requirements:
- clean architecture
- reusable functions
- no duplicated payloads
- descriptive test names
- proper use of `beforeEach`
- use constants for reusable values
- maintainable code

---

# Important Generation Rules

## DO NOT
- generate UI tests
- generate unnecessary comments
- hardcode repeated payloads
- place all payloads inline

---

## MUST DO
- use dynamic payload builders
- use helper functions
- use reusable constants
- organize tests using `describe()` blocks
- use data-driven testing where useful

---

# Required Test Coverage

## Positive Cases
- valid payload
- mandatory fields only
- title max limit
- title min limit
- large message
- display_logo false

---

## Negative Cases
- title integer
- title empty
- title max + 1
- invalid primary color
- empty primary color
- invalid secondary color
- invalid layout
- invalid display_logo
- invalid site id
- deleted site id
- another reseller site id

---

## Security Cases

Apply these validations for:
- title
- message
- primary_color
- secondary_color
- display_logo
- layout

Payload types:
- JS injection
- SQL injection
- traversal payload
- special characters

---

# Expected Output

Generate complete production-quality Cypress code including:

1. API helper file
2. Fixture/payload file
3. Cypress spec file
4. Reusable payload builder
5. Example assertions
6. Clean reusable structure

Output code in separate code blocks by file name.
