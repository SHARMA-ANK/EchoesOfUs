# Chapter Management API Implementation

## Overview
This document describes the implementation of Chapter Management APIs (Tasks 21-22) for the Family Archive Access Control feature.

## Implemented Endpoints

### 1. POST /api/chapters
**Purpose**: Create a new chapter using magic link token authentication

**Authentication**: Magic link token (no session required)

**Authorization**: Valid magic link token for a profile

**Request Body**:
```json
{
  "token": "string (required, 64-char hex)",
  "title": "string (required)",
  "transcript": "string (optional)",
  "summary": "string (optional)",
  "audioUrl": "string (optional)",
  "voiceId": "string (optional)"
}
```

**Alternative**: Token can be provided as query parameter `?token=...`

**Response**: Chapter object with auto-incremented `chapterNumber`

**Status Codes**:
- 201: Created
- 400: Bad request (missing title)
- 403: Forbidden (invalid or missing token)
- 500: Server error

**Features**:
- Validates magic link token format (64-char hex)
- Finds profile associated with token
- Auto-increments chapter number for the profile
- No session authentication required (magic link only)

### 2. GET /api/chapters/[id]
**Purpose**: Fetch a single chapter with conditional authentication

**Authentication**: Conditional
- **Public access**: If the chapter's family is published (`isPublishedToGlobal = true`)
- **Authenticated access**: If the chapter's family is unpublished (requires session + ownership)

**Authorization**: 
- Public if family is published
- Requires ownership if family is unpublished

**Response**: Chapter object with profile and family included

**Status Codes**:
- 200: Success (public or authorized)
- 401: Unauthorized (unpublished family, no session)
- 403: Forbidden (unpublished family, not owner)
- 404: Chapter not found
- 500: Server error

**Logic Flow**:
1. Fetch chapter with profile and family
2. Check if `family.isPublishedToGlobal = true`
3. If published → return chapter (public access)
4. If not published → require authentication and verify ownership

## Security Features

### Magic Link Token Validation
- Token must be exactly 64 characters
- Token must contain only hexadecimal characters (0-9, a-f)
- Token is validated against database records
- Invalid tokens return 403 Forbidden

### Conditional Authentication
- Published content is publicly accessible
- Unpublished content requires authentication and ownership
- Prevents unauthorized access to private family archives

### Data Integrity
- Chapter numbers are auto-incremented per profile
- Prevents duplicate chapter numbers
- Maintains sequential ordering

## Use Cases

### Interview Recording Flow
1. Admin creates profile → receives magic link token
2. Admin shares magic link with family member
3. Family member opens interview page with token
4. Interview is recorded and chapter is created using token
5. No authentication required for the family member

### Chapter Playback Flow
1. **Published Family**: Anyone can view chapters
2. **Unpublished Family**: Only family admin can view chapters

## Testing
Comprehensive tests verify:
- Magic link token validation (valid and invalid tokens)
- Chapter creation with token
- Auto-incrementing chapter numbers
- Conditional authentication based on publish state
- Public access to published chapters
- Restricted access to unpublished chapters

See `scripts/test-chapter-public-apis.ts` and `scripts/test-tasks-15-24.ts` for test implementations.
