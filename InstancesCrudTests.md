# Instances CRUD — Test Cases

All routes use middleware: `auth:api`, `passwordUpdated`, `nicoAuth:sites`, `siteSuspendState`, `ensureInstanceFeatureEnabled`.

Base path: `/sites/{site}/instances`

---

## 1. List Instances — `GET /sites/{site}/instances`

### 1.1 Positive

| ID | Description | Expected Status | Expected Response |
|----|-------------|-----------------|-------------------|
| LIST-01 | Valid site ID returns paginated list | 200 | `body` is array; pagination meta present |
| LIST-02 | `keyword` filter by title — match found | 200 | Returns only instances whose title contains the keyword |
| LIST-03 | `keyword` filter by title — no match | 200 | Empty array |
| LIST-04 | Pagination: `page=2` returns next page | 200 | Different set of instances from page 1 |
| LIST-05 | Site with zero instances returns empty list | 200 | Empty array |

### 1.2 Negative

| ID | Description | Expected Status | Expected Response |
|----|-------------|-----------------|-------------------|
| LIST-06 | Non-existent `site_id` | 404 | Error message |
| LIST-07 | Non-numeric `site_id` (e.g. `abc`) | 400 / 404 | Error message |
| LIST-08 | Unauthenticated request | 401 | Unauthorized error |
| LIST-09 | Site belongs to different reseller (forbidden) | 403 | Forbidden error |

### 1.3 Feature Gate

| ID | Description | `ENABLE_INSTANCES` | Expected Status |
|----|-------------|--------------------|-----------------|
| LIST-10 | List blocked when feature disabled | `false` | 422 |
| LIST-11 | List accessible when feature enabled | `true` | 200 |

---

## 2. Create Instance — `POST /sites/{site}/instances`

### 2.1 Positive

| ID | Description | Payload | Expected Status |
|----|-------------|---------|-----------------|
| CREATE-01 | All required fields provided | `title`, `message`, `primary_color`, `secondary_color` | 200 / 201 |
| CREATE-02 | All fields including optionals | All fields + `display_logo=true`, `layout="default"` | 200 / 201 |
| CREATE-03 | `display_logo` omitted (optional) | Required fields only | 200 / 201 |
| CREATE-04 | `layout` omitted — falls back to reseller default | Required fields, no `layout` | 200 / 201 |
| CREATE-05 | `layout` omitted — falls back to global default | Required fields, no `layout`, no reseller default | 200 / 201 |
| CREATE-06 | `display_logo=false` | Required fields + `display_logo=false` | 200 / 201 |
| CREATE-07 | Created instance has `status = draft` | Valid payload | 200 / 201 | `status = 0` (Draft) in response |
| CREATE-08 | `instance_settings` are seeded from `InstanceSettingDefault::config()` on creation | Valid payload | 200 / 201 | Instance settings present in DB |
| CREATE-09 | Multiple draft instances can exist on same site | Create 2nd instance after 1st | 200 / 201 |
| CREATE-10 | `title` at max length (255 chars) | `title` = 255-char string | 200 / 201 |
| CREATE-11 | `primary_color` 3-char hex (e.g. `#FFF`) | `primary_color="#FFF"` | 200 / 201 |
| CREATE-12 | `primary_color` 6-char hex (e.g. `#FFFFFF`) | `primary_color="#FFFFFF"` | 200 / 201 |
| CREATE-13 | `primary_color` 8-char hex with alpha (e.g. `#FFFFFF99`) | `primary_color="#FFFFFF99"` | 200 / 201 |

### 2.2 Title Validation

| ID | Description | `title` value | Expected Status | Expected Error |
|----|-------------|--------------|-----------------|----------------|
| CREATE-14 | Missing `title` | `""` or absent | 422 | `The title field is required.` |
| CREATE-15 | `title` > 255 characters | 256-char string | 422 | `The title may not be greater than 255 characters.` |
| CREATE-16 | `title` = null | `null` | 422 | Required error |
| CREATE-17 | XSS payload in `title` | `<script>alert(1)</script>` | not 500 | Handled safely |
| CREATE-18 | SQL injection in `title` | `' OR 1=1 --` | not 500 | Handled safely |

### 2.3 Message Validation

| ID | Description | `message` value | Expected Status | Expected Error |
|----|-------------|----------------|-----------------|----------------|
| CREATE-19 | Missing `message` | absent | 422 | `The message field is required.` |
| CREATE-20 | `message` = empty string | `""` | 422 | Required error |
| CREATE-21 | XSS payload in `message` | `<img src=x onerror=alert(1)>` | not 500 | Handled safely |

### 2.4 Color Validation

| ID | Description | Field | Value | Expected Status | Expected Error |
|----|-------------|-------|-------|-----------------|----------------|
| CREATE-22 | `primary_color` missing | `primary_color` | absent | 422 | `The primary color field is required.` |
| CREATE-23 | `primary_color` too short (< 4 chars) | `primary_color` | `#FF` | 422 | Min length error |
| CREATE-24 | `primary_color` too long (> 8 chars) | `primary_color` | `#FFFFFF999` | 422 | Max length error |
| CREATE-25 | `primary_color` without `#` | `primary_color` | `FFFFFF` | 422 | Hex validation error |
| CREATE-26 | `secondary_color` missing | `secondary_color` | absent | 422 | `The secondary color field is required.` |
| CREATE-27 | `secondary_color` too short (< 4 chars) | `secondary_color` | `#FF` | 422 | Min length error |
| CREATE-28 | `secondary_color` too long (> 8 chars) | `secondary_color` | `#FFFFFF999` | 422 | Max length error |
| CREATE-29 | `secondary_color` without `#` | `secondary_color` | `123456` | 422 | Hex validation error |

### 2.5 Layout Validation

| ID | Description | `layout` value | Expected Status | Expected Error |
|----|-------------|---------------|-----------------|----------------|
| CREATE-30 | Invalid layout string | `"invalid_layout_xyz"` | 422 | `InvalidLayoutException` |
| CREATE-31 | No default layout configured and `layout` omitted | absent (no templates) | 422 | `NoDefaultLayoutException` |
| CREATE-32 | `layout` exceeds 30 characters | 31-char string | 422 | Max length error |

### 2.6 display_logo Validation

| ID | Description | `display_logo` value | Expected Status |
|----|-------------|---------------------|-----------------|
| CREATE-33 | Non-boolean `display_logo` | `"yes"` | 422 |
| CREATE-34 | `display_logo=null` is accepted | `null` | 200 / 201 |

### 2.7 Site & Auth

| ID | Description | Expected Status |
|----|-------------|-----------------|
| CREATE-35 | Non-existent `site_id` | 404 |
| CREATE-36 | Unauthenticated request | 401 |
| CREATE-37 | Feature gate disabled | 422 |

---

## 3. Get Single Instance — `GET /sites/{site}/instances/{instance}`

### 3.1 Positive

| ID | Description | Expected Status | Expected Response |
|----|-------------|-----------------|-------------------|
| GET-01 | Valid `site_id` and `instance_id` for a draft | 200 | Instance object with correct `id` |
| GET-02 | Valid `site_id` and `instance_id` for live instance | 200 | Instance object; `status = 1` (Live) |
| GET-03 | Response contains all branding fields: `title`, `message`, `primary_color`, `secondary_color`, `display_logo`, `layout` | 200 | All fields present |
| GET-04 | Response contains `last_live_at` (null for draft, timestamp for published) | 200 | Correct `last_live_at` value |

### 3.2 Negative

| ID | Description | Expected Status |
|----|-------------|-----------------|
| GET-05 | Non-existent `instance_id` | 404 |
| GET-06 | `instance_id` belongs to different site (`site_id` mismatch) | 404 |
| GET-07 | Non-numeric `instance_id` | 400 / 404 |
| GET-08 | Non-existent `site_id` | 404 |
| GET-09 | Unauthenticated request | 401 |

### 3.3 Feature Gate

| ID | Description | Instance type | `ENABLE_INSTANCES` | Expected Status |
|----|-------------|---------------|--------------------|-----------------|
| GET-10 | Draft instance blocked when feature disabled | Draft | `false` | 422 |
| GET-11 | Live instance accessible when feature disabled | Live | `false` | 200 |
| GET-12 | Draft instance accessible when feature enabled | Draft | `true` | 200 |

---

## 4. Update Instance — `PUT /sites/{site}/instances/{instance}`

### 4.1 Positive

| ID | Description | Payload | Expected Status |
|----|-------------|---------|-----------------|
| UPDATE-01 | Update all fields at once | All fields with new values | 200 / 204 |
| UPDATE-02 | Partial update — only `title` | `{ "title": "New Title" }` | 200 / 204 |
| UPDATE-03 | Partial update — only `message` | `{ "message": "New message" }` | 200 / 204 |
| UPDATE-04 | Partial update — only `primary_color` | `{ "primary_color": "#AABBCC" }` | 200 / 204 |
| UPDATE-05 | Partial update — only `secondary_color` | `{ "secondary_color": "#112233" }` | 200 / 204 |
| UPDATE-06 | Partial update — only `display_logo` | `{ "display_logo": true }` | 200 / 204 |
| UPDATE-07 | Partial update — only `layout` | `{ "layout": "default" }` | 200 / 204 |
| UPDATE-08 | Update `display_logo` to null | `{ "display_logo": null }` | 200 / 204 |
| UPDATE-09 | Update live instance (should be allowed) | Valid payload, live instance | 200 / 204 |

### 4.2 Title Validation

| ID | Description | `title` value | Expected Status |
|----|-------------|--------------|-----------------|
| UPDATE-10 | `title` > 255 characters | 256-char string | 422 |
| UPDATE-11 | `title` = empty string | `""` | 422 |
| UPDATE-12 | XSS in `title` | `<script>alert(1)</script>` | not 500 |
| UPDATE-13 | SQL injection in `title` | `' OR 1=1 --` | not 500 |

### 4.3 Color Validation

| ID | Description | Field | Value | Expected Status |
|----|-------------|-------|-------|-----------------|
| UPDATE-14 | `primary_color` without `#` | `primary_color` | `AABBCC` | 422 |
| UPDATE-15 | `primary_color` too short | `primary_color` | `#FF` | 422 |
| UPDATE-16 | `primary_color` too long | `primary_color` | `#FFFFFF999` | 422 |
| UPDATE-17 | `secondary_color` without `#` | `secondary_color` | `AABBCC` | 422 |
| UPDATE-18 | `secondary_color` too short | `secondary_color` | `#FF` | 422 |
| UPDATE-19 | `secondary_color` too long | `secondary_color` | `#FFFFFF999` | 422 |

### 4.4 Layout Validation

| ID | Description | `layout` value | Expected Status |
|----|-------------|---------------|-----------------|
| UPDATE-20 | Invalid layout string | `"invalid_layout_xyz"` | 422 |
| UPDATE-21 | `layout` exceeds 30 characters | 31-char string | 422 |

### 4.5 Whitelist — Non-whitelisted fields ignored

| ID | Description | Payload | Expected Behavior |
|----|-------------|---------|-------------------|
| UPDATE-22 | `status` field in update body is ignored (not in whitelist) | `{ "status": 1 }` | 200 / 204; `status` unchanged |
| UPDATE-23 | `site_id` field in update body is ignored | `{ "site_id": 999 }` | 200 / 204; `site_id` unchanged |

### 4.6 Auth & Route

| ID | Description | Expected Status |
|----|-------------|-----------------|
| UPDATE-24 | Non-existent `instance_id` | 404 |
| UPDATE-25 | `instance_id` belongs to different site | 404 |
| UPDATE-26 | Unauthenticated request | 401 |
| UPDATE-27 | Feature gate disabled | 422 |

---

## 5. Delete Instance — `DELETE /sites/{site}/instances/{instance}`

### 5.1 Positive

| ID | Description | Expected Status | Expected Behavior |
|----|-------------|-----------------|-------------------|
| DELETE-01 | Delete a draft instance | 200 / 204 | Instance removed; subsequent GET returns 404 |
| DELETE-02 | After deletion, instance no longer appears in list | 200 / 204 | GET list excludes deleted instance |

### 5.2 Business Rule — Cannot delete live instance

| ID | Description | Expected Status | Expected Error |
|----|-------------|-----------------|----------------|
| DELETE-03 | Attempt to delete the live instance | 400 | `Cannot delete the live instance.` |
| DELETE-04 | After failed delete attempt, instance still exists | — | GET returns 200 |

### 5.3 Negative

| ID | Description | Expected Status |
|----|-------------|-----------------|
| DELETE-05 | Non-existent `instance_id` | 404 |
| DELETE-06 | `instance_id` belongs to different site | 404 |
| DELETE-07 | Unauthenticated request | 401 |
| DELETE-08 | Feature gate disabled | 422 |
| DELETE-09 | Delete already-deleted instance (idempotency) | 404 |

---

## 6. Publish Instance — `PUT /sites/{site}/instances/{instance}/publish`

### 6.1 Positive

| ID | Description | Expected Status | Expected Behavior |
|----|-------------|-----------------|-------------------|
| PUBLISH-01 | Publish a draft instance | 200 | Target instance `status = 1` (Live); `last_live_at` set to now |
| PUBLISH-02 | Previous live instance is demoted to draft | 200 | Old live instance `status = 0` (Draft) |
| PUBLISH-03 | `sites.live_instance_id` updated to new live instance | 200 | Site's `live_instance_id` matches published instance `id` |
| PUBLISH-04 | Publish sets `last_live_at` timestamp on target instance | 200 | `last_live_at` is a recent timestamp |
| PUBLISH-05 | Exactly one live instance exists per site after publish | 200 | Only one instance with `status = 1` across all instances for site |

### 6.2 Business Rule — Cannot re-publish already-live instance

| ID | Description | Expected Status | Expected Error |
|----|-------------|-----------------|----------------|
| PUBLISH-06 | Attempt to publish the currently-live instance | 400 | `Selected instance is already live` |

### 6.3 Atomicity

| ID | Description | Expected Behavior |
|----|-------------|-------------------|
| PUBLISH-07 | If publish fails mid-way, no partial state is left | Neither demotion nor promotion committed (transaction rollback) |

### 6.4 Negative

| ID | Description | Expected Status |
|----|-------------|-----------------|
| PUBLISH-08 | Non-existent `instance_id` | 404 |
| PUBLISH-09 | `instance_id` belongs to different site | 404 |
| PUBLISH-10 | Unauthenticated request | 401 |
| PUBLISH-11 | Feature gate disabled | 422 |

---

## 7. Feature Gate — `ENABLE_INSTANCES`

All tests in this section assume a fresh site with the default setting (`ENABLE_INSTANCES = false`).

| ID | Route | Method | Instance type | `ENABLE_INSTANCES` | Expected Status |
|----|-------|--------|---------------|--------------------|-----------------|
| GATE-01 | `/sites/{site}/instances` | GET (List) | — | `false` | 422 |
| GATE-02 | `/sites/{site}/instances` | POST (Create) | — | `false` | 422 |
| GATE-03 | `/sites/{site}/instances/{draft}` | GET | Draft | `false` | 422 |
| GATE-04 | `/sites/{site}/instances/{live}` | GET | Live | `false` | 200 |
| GATE-05 | `/sites/{site}/instances/{draft}` | PUT (Update) | Draft | `false` | 422 |
| GATE-06 | `/sites/{site}/instances/{live}` | PUT (Update) | Live | `false` | 422 |
| GATE-07 | `/sites/{site}/instances/{draft}` | DELETE | Draft | `false` | 422 |
| GATE-08 | `/sites/{site}/instances/{instance}/publish` | PUT | Any | `false` | 422 |
| GATE-09 | All routes above | — | — | `true` | Proceed normally (per respective rules) |

---

## 8. Authentication & Authorization

| ID | Description | Expected Status |
|----|-------------|-----------------|
| AUTH-01 | All routes: missing `Authorization` header | 401 |
| AUTH-02 | All routes: expired / invalid token | 401 |
| AUTH-03 | All routes: user's password not updated (`passwordUpdated` middleware) | 403 / 422 |
| AUTH-04 | `nicoAuth:sites` — user without site permission | 403 |
| AUTH-05 | Suspended site — `siteSuspendState` middleware blocks write operations | 422 / 403 |

---

## Test Setup Notes

- **`site_id`**: Use a test site with `ENABLE_INSTANCES = true` for all non-gate tests.
- **Instance lifecycle**: Create a fresh draft in `before()` for each `describe` block that needs one; clean up in `after()` with `DELETE`.
- **Live instance**: Use `PUT /publish` in `before()` to promote a draft to live where a live instance is required.
- **Feature gate tests**: Toggle `ENABLE_INSTANCES` via the site settings API before each gate test and restore afterward.
- **Publish atomicity test**: Simulate failure by injecting a DB error or using a test-only hook; verify no partial state remains.
