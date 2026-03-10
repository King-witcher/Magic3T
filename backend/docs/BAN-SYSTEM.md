# Ban System

## Overview

The ban system allows users with the `creator` role to ban other users from the platform. Bans can be either **temporary** (with a specific duration) or **permanent**.

## API Endpoints

All endpoints require authentication and the `creator` role.

### Ban a User

**POST** `/admin/ban`

Bans a user from the platform.

#### Request Body

```json
{
  "userId": "string",      // Required: ID of the user to ban
  "type": "permanent" | "temporary",  // Required: Type of ban
  "reason": "string",      // Required: Reason for the ban
  "duration": number       // Required for temporary bans: Duration in seconds
}
```

#### Response

```json
{
  "success": true,
  "userId": "string",
  "type": "permanent" | "temporary",
  "expiresAt": "ISO 8601 date string"  // Only for temporary bans
}
```

#### Error Codes

- `invalid-ban-duration`: Duration is missing or invalid for temporary bans
- `user-not-found`: The target user does not exist
- `cannot-ban-creator`: Cannot ban a user with the creator role
- `cannot-ban-self`: Cannot ban yourself

### Unban a User

**DELETE** `/admin/ban`

Removes a ban from a user.

#### Request Body

```json
{
  "userId": "string"  // Required: ID of the user to unban
}
```

#### Response

```json
{
  "success": true,
  "userId": "string"
}
```

#### Error Codes

- `user-not-found`: The target user does not exist
- `user-not-banned`: The user is not currently banned

## Ban Behavior

### Temporary Bans

- Temporary bans automatically expire after the specified duration
- Expired bans are automatically removed when the user attempts to access protected resources
- The `expiresAt` field indicates when the ban will be lifted

### Permanent Bans

- Permanent bans do not expire automatically
- A creator must explicitly unban the user using the unban endpoint

### Protected Resources

When a user is banned, they will receive a `user-banned` error (HTTP 403) when trying to:

- Enter the matchmaking queue (ranked or casual)
- Play against bots
- Connect to match WebSocket
- Access any other ban-protected endpoint

The error response includes ban details:

```json
{
  "errorCode": "user-banned",
  "metadata": {
    "type": "permanent" | "temporary",
    "reason": "Reason for the ban",
    "expiresAt": "ISO 8601 date string"  // Only for temporary bans
  }
}
```

## Database Schema

Bans are stored in the `ban` field of the user document:

```typescript
type UserRowBan = {
  type: 'permanent' | 'temporary'
  reason: string
  issued_at: Date
  expires_at?: Date  // Only for temporary bans
  issued_by: string  // User ID of the admin who issued the ban
}
```

## Examples

### Ban a user for 24 hours

```bash
curl -X POST /admin/ban \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "target-user-id",
    "type": "temporary",
    "reason": "Inappropriate behavior",
    "duration": 86400
  }'
```

### Permanently ban a user

```bash
curl -X POST /admin/ban \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "target-user-id",
    "type": "permanent",
    "reason": "Repeated violations"
  }'
```

### Unban a user

```bash
curl -X DELETE /admin/ban \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "target-user-id"
  }'
```
