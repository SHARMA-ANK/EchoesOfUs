# Family Management API Implementation

## Overview

This document describes the implementation of Tasks 11-14: Family Management API Routes for the Family Archive Access Control feature.

## Implemented Routes

### Task 11: GET /api/families
**File:** `app/api/families/route.ts`

**Functionality:**
- Requires authentication via session cookie
- Fetches all families where `adminUserId` equals the current authenticated user
- Includes related profiles and chapters in the response
- Returns families ordered by creation date (newest first)

**Status Codes:**
- `200 OK`: Successfully retrieved families
- `401 Unauthorized`: No valid session cookie provided

**Response Format:**
```typescript
Family[] // Array of Family objects with nested profiles and chapters
```

---

### Task 12: POST /api/families
**File:** `app/api/families/route.ts`

**Functionality:**
- Requires authentication via session cookie
- Validates `familyName` input (non-empty string)
- Creates a new Family record with:
  - `adminUserId` set to current authenticated user
  - `isPublishedToGlobal` defaulted to `false`
  - Trimmed family name
- Returns the created family with empty profiles array

**Status Codes:**
- `201 Created`: Successfully created family
- `400 Bad Request`: Invalid or missing familyName
- `401 Unauthorized`: No valid session cookie provided

**Request Body:**
```typescript
{
  familyName: string // Required, non-empty
}
```

**Response Format:**
```typescript
Family // Created family object
```

---

### Task 13: PATCH /api/families/[id]
**File:** `app/api/families/[id]/route.ts`

**Functionality:**
- Requires authentication via session cookie
- Verifies family ownership using `requireFamilyOwnership` middleware
- Supports updating:
  - `familyName` (string, non-empty)
  - `isPublishedToGlobal` (boolean)
- Can update one or both fields in a single request
- Returns updated family with nested profiles and chapters

**Status Codes:**
- `200 OK`: Successfully updated family
- `400 Bad Request`: Invalid field values or no fields provided
- `401 Unauthorized`: No valid session cookie provided
- `403 Forbidden`: User does not own the family
- `404 Not Found`: Family does not exist

**Request Body:**
```typescript
{
  familyName?: string,        // Optional, non-empty if provided
  isPublishedToGlobal?: boolean // Optional
}
```

**Response Format:**
```typescript
Family // Updated family object with nested data
```

---

### Task 14: DELETE /api/families/[id]
**File:** `app/api/families/[id]/route.ts`

**Functionality:**
- Requires authentication via session cookie
- Verifies family ownership using `requireFamilyOwnership` middleware
- Deletes the family record
- Automatically cascades deletion to:
  - All associated profiles
  - All chapters belonging to those profiles
  (Cascade behavior is enforced by Prisma schema)

**Status Codes:**
- `200 OK`: Successfully deleted family
- `401 Unauthorized`: No valid session cookie provided
- `403 Forbidden`: User does not own the family
- `404 Not Found`: Family does not exist

**Response Format:**
```typescript
{
  success: true
}
```

---

## Security Features

### Authentication
All routes use the `requireAuth` middleware from `lib/auth/middleware.ts`:
- Extracts session token from HTTP-only cookie
- Validates session against database
- Returns user object if valid, null otherwise
- Routes return 401 if authentication fails

### Authorization
Update and delete routes use `requireFamilyOwnership` middleware:
- Verifies the authenticated user is the family's admin
- Prevents cross-user data access
- Returns 403 for ownership violations
- Returns 404 for non-existent families

### Input Validation
- Family names are trimmed and validated for non-empty content
- Boolean flags are type-checked
- Empty update requests are rejected with 400

### Data Isolation
- GET endpoint filters by `adminUserId` automatically
- Users can only see and modify their own families
- No cross-tenant data leakage

---

## Testing

### Test Script
**File:** `scripts/test-family-apis.ts`

Comprehensive test coverage including:
1. ✅ Create family (authenticated)
2. ✅ Create family (unauthenticated - should fail)
3. ✅ Fetch families (authenticated)
4. ✅ Fetch families (unauthenticated - should fail)
5. ✅ Update family name
6. ✅ Toggle publish status
7. ✅ Update family (unauthorized user - should fail)
8. ✅ Update family (non-existent - should fail)
9. ✅ Delete family (unauthorized user - should fail)
10. ✅ Delete family with cascade deletion
11. ✅ Delete family (non-existent - should fail)

### Test Results
All 12 tests passed successfully, verifying:
- Authentication enforcement
- Authorization checks
- Input validation
- Cascade deletion
- Proper HTTP status codes
- Data isolation between users

---

## Database Schema

The routes interact with the following Prisma models:

```prisma
model Family {
  id                  String   @id @default(cuid())
  adminUserId         String
  familyName          String
  isPublishedToGlobal Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  adminUser           User     @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  profiles            Profile[]
  
  @@index([adminUserId])
  @@index([isPublishedToGlobal])
}
```

---

## Requirements Validation

### Requirement 2: Family Archive Management
✅ **2.1**: Family creation stores family_name and links to admin_user_id  
✅ **2.2**: is_published_to_global defaults to FALSE  
✅ **2.3**: Only Admin_User can modify their Family_Archive  
✅ **2.4**: Admin_User can toggle is_published_to_global flag  
✅ **2.5**: Family deletion cascades to Profiles and Chapters  

### Requirement 9: API Route Protection
✅ **9.1**: Routes protected with authentication middleware  
✅ **9.2**: Ownership verification before modifications  
✅ **9.5**: Appropriate HTTP status codes (401, 403, 404)  

---

## Next Steps

The following related tasks should be implemented next:
- **Task 15-20**: Profile Management API Routes
- **Task 23**: Human Archive API (public endpoint)
- **Task 29-32**: Family Dashboard UI components

---

## Files Created

1. `app/api/families/route.ts` - GET and POST handlers
2. `app/api/families/[id]/route.ts` - PATCH and DELETE handlers
3. `app/api/families/route.test.ts` - Unit tests for GET and POST
4. `app/api/families/[id]/route.test.ts` - Unit tests for PATCH and DELETE
5. `scripts/test-family-apis.ts` - Integration test script
6. `app/api/families/IMPLEMENTATION.md` - This documentation

---

## Dependencies

- `@/lib/prisma` - Database client
- `@/lib/auth/middleware` - Authentication and authorization utilities
- `next/server` - Next.js server utilities (NextRequest, NextResponse)
