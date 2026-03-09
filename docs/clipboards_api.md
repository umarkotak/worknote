# Clipboards API Documentation

## Overview

The Clipboards API lets each authenticated user save and manage personal copy-paste snippets.

Each clipboard item supports only these fields:
- `title` (optional text)
- `tags` (optional array of text)
- `content` (required text)

All data is user-scoped: users can only create/read/update/delete their own clipboard items.

---

## Authentication

All clipboard endpoints require a valid bearer token.

```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Create Clipboard Item

**Endpoint:** `POST /clipboards`

**Request Body:**

```json
{
  "title": "SSH command",
  "tags": ["devops", "ssh"],
  "content": "ssh -i ~/.ssh/key.pem user@server"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Short title for easier scanning |
| `tags` | string[] | No | Optional tags |
| `content` | string | Yes | Clipboard content |

**Response:** `201 Created`

```json
{
  "id": 1,
  "title": "SSH command",
  "tags": ["devops", "ssh"],
  "content": "ssh -i ~/.ssh/key.pem user@server",
  "created_at": "2026-03-09T09:00:00Z",
  "updated_at": "2026-03-09T09:00:00Z"
}
```

---

### 2. List Clipboard Items (Infinite Scroll)

**Endpoint:** `GET /clipboards`

Supports:
- Search in `title` and `content`
- Cursor-based pagination (keyset pagination) for efficient infinite scroll

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `search` | string | `""` | - | Case-insensitive search by title/content |
| `cursor` | int64 | `0` | - | Return items with `id < cursor` |
| `limit` | int | `20` | `100` | Items per request |

**First page example:**

```
GET /clipboards?search=ssh&limit=20
```

**Next page example (from previous `next_cursor`):**

```
GET /clipboards?search=ssh&cursor=128&limit=20
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 130,
      "title": "SSH command",
      "tags": ["devops", "ssh"],
      "content": "ssh -i ~/.ssh/key.pem user@server",
      "created_at": "2026-03-09T09:00:00Z",
      "updated_at": "2026-03-09T09:00:00Z"
    }
  ],
  "next_cursor": 130,
  "has_more": true,
  "limit": 20
}
```

---

### 3. Get Clipboard Item

**Endpoint:** `GET /clipboards/:id`

**Response:** `200 OK`

Returns a single clipboard item in the same shape as create response.

---

### 4. Update Clipboard Item

**Endpoint:** `PUT /clipboards/:id`

All fields are optional in update payload, but if `content` is provided it must be non-empty.

**Request Body Example:**

```json
{
  "title": "Prod SSH",
  "tags": ["devops", "prod"],
  "content": "ssh -i ~/.ssh/prod.pem user@prod-server"
}
```

**Response:** `200 OK`

Returns the updated clipboard item.

---

### 5. Delete Clipboard Item

**Endpoint:** `DELETE /clipboards/:id`

**Response:** `204 No Content`

---

## How It Is Implemented

### 1. Database migration

Migration file: `db/migrations/008_create_clipboards.sql`

- Creates `clipboards` table with:
  - `user_id` foreign key to `users(id)` with cascade delete
  - `title` nullable text
  - `tags` text array with default `[]`
  - `content` required text
  - timestamps
- Adds indexes for:
  - user-scoped keyset pagination: `(user_id, id DESC)`
  - faster search on title/content via `pg_trgm` GIN indexes

### 2. Model

Model added in `model/model.go`:
- `Clipboard` with `ID`, `UserID`, `Title`, `Tags`, `Content`, `CreatedAt`, `UpdatedAt`

### 3. Repository

Repository added in `repos/clipboard_repo/clipboard_repo.go`:
- `Create`
- `GetByID` (scoped by `user_id`)
- `ListByUserID` with search + cursor-based pagination
- `Update`
- `Delete`

The list query uses keyset pagination (`id < cursor`) instead of offset for better performance in infinite scroll scenarios.

### 4. Service

Service added in `services/clipboard_service/clipboard_service.go`:
- Validates `content` is required on create
- Validates non-empty `content` when included in update
- Applies defaults (`tags` to empty array)
- Handles not-found behavior with a dedicated service error

### 5. Handler

Handler added in `handlers/clipboard_handler/clipboard_handler.go`:
- Parses request/query params
- Pulls user from auth context
- Maps service output into API contracts
- Returns appropriate HTTP statuses

### 6. Route registration

`main.go` updated to:
- initialize `clipboard_repo`
- register protected routes under `/clipboards`

---

## Run Migration

```bash
psql -d myfutureme -f db/migrations/008_create_clipboards.sql
```

Then run the API and call the `/clipboards` endpoints with a valid access token.
