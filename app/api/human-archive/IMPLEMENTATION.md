# Public APIs Implementation

## Overview
This document describes the implementation of Public APIs (Tasks 23-24) for the Family Archive Access Control feature.

## Implemented Endpoints

### 1. GET /api/human-archive
**Purpose**: Fetch all published family archives for public browsing

**Authentication**: None (public endpoint)

**Authorization**: None (public access)

**Response**: Array of Family objects with profiles and chapters

**Query Logic**:
```typescript
prisma.family.findMany({
  where: {
    isPublishedToGlobal: true,
  },
  include: {
    profiles: {
      include: {
        chapters: {
          orderBy: {
            chapterNumber: "asc",
          },
        },
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
})
```

**Status Codes**:
- 200: Success (returns empty array if no published families)
- 500: Server error

**Features**:
- Returns only families where `isPublishedToGlobal = true`
- Includes all profiles and chapters for each family
- Chapters are ordered by chapter number
- Families are ordered by creation date (newest first)
- No authentication required

### 2. GET /api/book/[share_slug]
**Purpose**: Fetch a profile's audiobook by share slug (with visibility check)

**Authentication**: None (public endpoint)

**Authorization**: Only accessible if family is published

**Response**: Profile object with family and chapters

**Query Logic**:
```typescript
const profile = await prisma.profile.findUnique({
  where: { shareSlug },
  include: {
    family: true,
    chapters: {
      orderBy: { chapterNumber: "asc" },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        summary: true,
        audioUrl: true,
      },
    },
  },
});

// Return 404 if profile doesn't exist OR family is not published
if (!profile || !profile.family.isPublishedToGlobal) {
  return 404;
}
```

**Status Codes**:
- 200: Success (profile found and family is published)
- 404: Not found (profile doesn't exist OR family is unpublished)
- 500: Server error

**Features**:
- Fetches profile by unique `shareSlug`
- Checks `family.isPublishedToGlobal` flag
- Returns 404 for unpublished families (privacy protection)
- Returns 404 for non-existent profiles
- Includes family and chapters in response

## Security Features

### Privacy Protection
- Unpublished families are completely hidden from public view
- Returns 404 (not 403) to avoid revealing existence of unpublished content
- No authentication bypass possible

### Data Filtering
- Only published families appear in Human Archive
- Unpublished profiles cannot be accessed via share slug
- Consistent privacy enforcement across all public endpoints

## Use Cases

### Human Archive Browsing
1. User visits home page
2. Page fetches `/api/human-archive`
3. Displays grid of published family archives
4. User can browse all public content
5. No login required

### Audiobook Sharing
1. Admin publishes family archive
2. Admin shares profile's `shareSlug` URL
3. Anyone can access audiobook via `/api/book/[shareSlug]`
4. If admin unpublishes family, link returns 404

### Privacy Control
1. Admin creates family (unpublished by default)
2. Content is private, not accessible via public APIs
3. Admin can preview content while logged in
4. Admin publishes when ready to share
5. Admin can unpublish at any time to make private again

## Publish State Transitions

### Unpublished → Published
- Family becomes visible in Human Archive
- All profiles and chapters become publicly accessible
- Share slug URLs start working

### Published → Unpublished
- Family disappears from Human Archive
- Share slug URLs return 404
- Content becomes private again
- Only family admin can access via authenticated endpoints

## Testing
Comprehensive tests verify:
- Only published families appear in Human Archive
- Unpublished families are hidden
- Share slug access requires published family
- 404 returned for unpublished profiles
- Publish state transitions work correctly
- Data includes profiles and chapters

See `scripts/test-chapter-public-apis.ts` and `scripts/test-tasks-15-24.ts` for test implementations.
