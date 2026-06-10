# Instance Validation Testing Automation

**Note**: A default instance is automatically created during site creation. All CRUD operations below assume the site and its default instance(s) already exist.

## 📌 Properties
- **id**: Unique identifier (mandatory)  
- **site_id**: Foreign key → sites (**must be integer**, mandatory)  
- **name**: String, **max length 255 characters** (mandatory)  
- **status**: Boolean, **only one instance per site can be true** (mandatory)  
- **layout**: Must be selected from available layout list (themes) (mandatory)  
- **message**: Text value (mandatory)  
- **primary_color**: Valid hex color code starting with `#` (mandatory)  
- **secondary_color**: Valid hex color code starting with `#` (mandatory)  
- **global_video**: Valid URL pointing to a video resource (mandatory)  
- **display_logo**: Valid URL (optional)  

---

## 🌐 Endpoints
- **List Instances**:  
  `GET {{baseUrl}}/sites/{site_id}/instances`  

- **Single Instance Retrieval**:  
  `GET {{baseUrl}}/sites/{site_id}/instances/{instance_id}`  

---

## ✅ Validation Rules
1. **id** must be unique.  
2. **site_id** must reference an existing site and be an integer.  
3. **name** must not exceed 255 characters.  
4. **status** must be boolean; only one instance per site can be `true`.  
5. **layout** must be chosen from predefined layout list.  
6. **message** must be text.  
7. **primary_color** and **secondary_color** must be valid hex codes (e.g., `#FFFFFF`).  
8. **global_video** must be a valid URL.  
9. **display_logo** is optional but, if provided, must be a valid URL.  
10. **Default instance**: Every site has at least one instance created during site creation; instances cannot be removed entirely from a site.  

---

## 🔒 Security Validation (within CRUD Operations)
- **XSS in Fields**: Inject `<script>` tags in `name`, `message`, `layout` → expect safe handling (no 500 error)
- **SQL Injection**: Inject SQL patterns (`' OR 1=1 --`, `; DROP TABLE`) in `name`, `message` → expect safe handling
- **Special Characters**: Input special chars (`@`, `$`, `%`, `&`) in `name`, `message` → should be accepted or sanitized
- **Path Traversal**: Inject `../` or absolute paths in `global_video`, `display_logo` URLs → expect validation/rejection
- **Oversized Payloads**: Submit extremely long `message` or URL values → expect validation error or rejection
- **Unauthorized Access**: Attempt to access/modify instances of another site → expect `403`/`404`
- **Broken Authentication**: Access endpoints without valid auth token → expect `401`

---

## 🧪 CRUD Test Scenarios

### CREATE — Instance Creation
- **Valid Creation**: Provide all mandatory fields (`name`, `status`, `layout`, `message`, `primary_color`, `secondary_color`, `global_video`) with valid values → expect `201`/`200`
- **Optional Fields**: Omit `display_logo` → should succeed (optional field)
- **Created Instance Status**: Newly created instance must have correct `status` value
- **Default Layout**: If `layout` is omitted, should use reseller/global default layout
- **Instance Settings**: Verify `instance_settings` are seeded from `InstanceSettingDefault::config()` on creation
- **Multiple Instances**: Create 2nd instance on same site → should succeed (multiple draft instances allowed)

### READ — List & Retrieve Instances
- **List All Instances**: `GET /sites/{site_id}/instances` returns paginated list of all instances for site
- **List with Pagination**: `page=2` returns different set of instances from `page=1`
- **List with Keyword Filter**: Filter by `name` keyword → returns only instances matching keyword
- **List with No Match**: Filter by keyword with no matches → returns empty filtered result (but site has default instance)
- **Single Instance Retrieval**: `GET /sites/{site_id}/instances/{instance_id}` returns correct instance by id
- **Response Contains All Fields**: Verify response includes `id`, `name`, `status`, `layout`, `message`, `primary_color`, `secondary_color`, `global_video`, `display_logo`
- **Draft Instance `last_live_at`**: Draft instance should have `last_live_at = null`
- **Published Instance `last_live_at`**: Published instance should have `last_live_at = timestamp`

### UPDATE — Modify Instance
- **Update Single Field**: Update only `name` → should succeed
- **Update Multiple Fields**: Update `name`, `message`, `primary_color` in one request → should succeed
- **Update `display_logo`**: Change `display_logo` value → should succeed
- **Update `layout`**: Change layout to valid alternative → should succeed
- **Update to null**: Set `display_logo` to null → should succeed
- **Non-whitelisted Fields Ignored**: Send `status` or `site_id` in update body → fields should be ignored, not updated
- **Update Live Instance**: Update fields on live instance → should succeed (live instances can be updated)
- **Partial Update Isolation**: Update does not affect other instances on same site

### DELETE — Remove Instance
- **Delete Draft Instance**: Remove a draft instance → expect `200`/`204`
- **Deleted Instance Not in List**: After deletion, `GET /sites/{site_id}/instances` no longer includes deleted instance
- **Idempotency**: Attempt to delete already-deleted instance → expect `404`
- **Cannot Delete Live Instance**: Attempt to delete the live instance → expect `400` with error message `"Cannot delete the live instance."`

### PUBLISH — Promote to Live (State Change)
- **Publish Draft to Live**: `PUT /sites/{site_id}/instances/{instance_id}/publish` on draft instance → `status` changes to `true` (live)
- **Old Live Demoted**: Previous live instance is demoted to draft (`status = false`)
- **`sites.live_instance_id` Updated**: After publish, `sites.live_instance_id` matches new live instance `id`
- **`last_live_at` Timestamp Set**: Published instance has `last_live_at = current_timestamp`
- **Exactly One Live per Site**: After publish, only one instance has `status = true` across all instances for site
- **Cannot Re-publish Live**: Attempt to publish already-live instance → expect `400` with error `"Selected instance is already live"`

---

## ❌ Negative Test Cases

### CREATE — Invalid Inputs
- **Missing `name`**: Omit `name` field → expect validation error
- **`name` > 255 chars**: Provide `name` exceeding 255 characters → expect validation error
- **Missing `message`**: Omit `message` → expect validation error
- **Missing `status`**: Omit `status` → expect validation error
- **Invalid `status`**: Provide non-boolean `status` (e.g., `"active"`, `2`) → expect validation error
- **Missing `primary_color`**: Omit `primary_color` → expect validation error
- **`primary_color` without `#`**: Provide `#123456` as `123456` (no hash) → expect validation error
- **`primary_color` invalid hex length**: Provide `#FF` (too short) or `#FFFFFF999` (too long) → expect validation error
- **Missing `secondary_color`**: Omit `secondary_color` → expect validation error
- **`secondary_color` format errors**: Same as `primary_color` validation → expect validation error
- **Missing `global_video`**: Omit `global_video` → expect validation error
- **`global_video` invalid URL**: Provide malformed URL → expect validation error
- **`display_logo` invalid URL**: If provided, must be valid URL → expect validation error
- **Invalid Layout**: Provide `layout` not in predefined list → expect validation error
- **Invalid site_id**: Provide non-existent or non-integer `site_id` → expect `404`

### READ — Invalid Requests
- **Non-existent `instance_id`**: `GET /sites/{site_id}/instances/{instance_id}` with invalid id → expect `404`
- **Instance belongs to different site**: Request instance from wrong site → expect `404`
- **Invalid site_id**: Use non-existent site → expect `404`
- **Unauthenticated**: Missing or invalid auth token → expect `401`

### UPDATE — Invalid Inputs
- **`name` > 255 chars**: Update `name` exceeding 255 characters → expect validation error
- **`name` empty string**: Update `name` to `""` → expect validation error
- **Invalid color**: Update `primary_color`/`secondary_color` with invalid hex → expect validation error
- **Invalid layout**: Update `layout` to non-existent template → expect validation error
- **Invalid `display_logo` URL**: Update with malformed URL → expect validation error
- **Non-existent instance**: Update non-existent `instance_id` → expect `404`
- **Unauthenticated**: Missing auth token → expect `401`

### DELETE — Invalid Requests
- **Non-existent `instance_id`**: Attempt delete on non-existent instance → expect `404`
- **Unauthenticated**: Missing auth token → expect `401`

### PUBLISH — Invalid Requests
- **Non-existent instance**: Publish non-existent instance → expect `404`
- **Already Live**: Attempt to publish already-live instance → expect `400` with error message
- **Unauthenticated**: Missing auth token → expect `401`  

---

## 🔒 Security Validation
- **SQL Injection**: Attempt to inject SQL in `name` or `message` fields; expect rejection.  
- **Script Injection (XSS)**: Insert `<script>` tags or HTML in `message`, `layout`, or `name`; expect sanitization or error.  
- **Path Traversal**: Try using `../` or absolute paths in `global_video` or `display_logo`; expect rejection.  
- **Large Payloads**: Submit oversized `message` or `global_video` values; expect validation error or rejection.  
- **Unauthorized Access**: Attempt to access instances of another site_id without permission; expect 403/401 error.  
- **Invalid HTTP Methods**: Use unsupported methods (e.g., `PUT` on list endpoint); expect 405 Method Not Allowed.  
- **Rate Limiting**: Flood API with repeated requests; expect throttling or error response.  
- **Broken Authentication**: Try accessing endpoints without valid token/session; expect 401 Unauthorized.  

---

## 📤 Example Request
```http
POST {{baseUrl}}/sites/123/instances
Content-Type: application/json

{
  "name": "Main Instance",
  "status": true,
  "layout": "default",
  "message": "Welcome to the site",
  "primary_color": "#123456",
  "secondary_color": "#654321",
  "global_video": "https://example.com/video.mp4",
  "display_logo": "https://example.com/logo.png"
}
