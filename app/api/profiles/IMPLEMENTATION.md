# Profile Management API Implementation

## Overview
This document describes the implementation of Profile Management APIs (Tasks 15-20) for the Family Archive Access Control feature.

## Implemented Endpoints

### 1. GET /api/profiles
**Purpose**: Fetch all profiles owned by the authenticated user

**Authentication**: Required (session cookie)

**Authorization**: Returns only profiles where `family.adminUserId = current user`

**Response**: Array of Profile objects with family and chapters included

**Status Codes**:
- 200: Success
- 401: Unauthorized (no valid session)
- 500: Server error

### 2. POST /api/profiles
**Purpose**: Create a new profile with magic link token

**Authentication**: Required (session cookie)

**Authorization**: Requires ownership of the specified family

**Request Body**:
```json
{
  "familyId": "string (required)",
  "name": "string (required)",
  "age": "number (required)",
  "relation": "string (optional)"
}
```

**Response**: Profile object with generated `magicLinkToken` (64-char hex string)

**Status Codes**:
- 201: Created
- 400: Bad request (missing required fields)
- 401: Unauthorized
- 403: Forbidden (user doesn't own the family)
- 500: Server error

### 3. GET /api/profiles/[id]
**Purpose**: Fetch a single profile by ID

**Authentication**: Required (session cookie)

**Authorization**: Requires ownership of the profile's family

**Response**: Profile object with chapters included

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Forbidden (user doesn't own the profile)
- 404: Profile not found
- 500: Server error

### 4. PATCH /api/profiles/[id]
**Purpose**: Update profile attributes

**Authentication**: Required (session cookie)

**Authorization**: Requires ownership of the profile's family

**Request Body** (all fields optional):
```json
{
  "name": "string",
  "age": "number",
  "relation": "string"
}
```

**Response**: Updated Profile object

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Forbidden
- 404: Profile not found
- 500: Server error

### 5. DELETE /api/profiles/[id]
**Purpose**: Delete a profile (cascade deletes chapters)

**Authentication**: Required (session cookie)

**Authorization**: Requires ownership of the profile's family

**Response**: `{ success: true }`

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Forbidden
- 404: Profile not found
- 500: Server error

### 6. POST /api/profiles/[id]/regenerate-token
**Purpose**: Generate a new magic link token for a profile

**Authentication**: Required (session cookie)

**Authorization**: Requires ownership of the profile's family

**Response**: `{ magicLinkToken: "string" }`

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Forbidden
- 404: Profile not found
- 500: Server error

## Security Features

### Authentication
- All endpoints require valid session cookie
- Session validation via `requireAuth()` middleware

### Authorization
- Family ownership check via `requireFamilyOwnership()`
- Profile ownership check via `requireProfileOwnership()`
- Ownership is verified through the family's `adminUserId` field

### Magic Link Tokens
- Generated using `crypto.randomBytes(32).toString('hex')`
- 64-character hexadecimal strings
- Cryptographically secure random generation
- Unique per profile

## Data Isolation
- Users can only access profiles belonging to families they own
- Cross-user data access is prevented through ownership checks
- Database queries filter by `family.adminUserId`

## Testing
Comprehensive tests verify:
- Authentication requirements
- Ownership checks
- Data isolation between users
- Magic link token generation and format
- Cascade deletion of chapters
- Token regeneration

See `scripts/test-profile-apis.ts` and `scripts/test-tasks-15-24.ts` for test implementations.
