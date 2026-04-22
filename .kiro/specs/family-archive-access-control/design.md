# Design Document: Family Archive Access Control

## Overview

This design implements a secure, multi-tenant "Family Archive" architecture for the Echoes of Us application. The system transforms the current open-access model into a privacy-first platform where authenticated users manage family collections, control visibility, and share interview access via cryptographically secure magic links.

The architecture introduces three distinct access patterns:
1. **Authenticated Admin Access**: Full CRUD operations on owned Family Archives
2. **Magic Link Access**: Unauthenticated, token-based access to specific Profile interview interfaces
3. **Public Read Access**: Anonymous browsing of published Family Archives on the Human Archive

This design prioritizes security, data isolation, and user experience while maintaining backward compatibility with existing Profile and Chapter data.

## Architecture

### System Components

The system consists of four primary layers:

1. **Authentication Layer**: Session-based authentication using secure HTTP-only cookies, bcrypt password hashing, and session management middleware
2. **Data Access Layer**: Prisma ORM with SQLite, enforcing row-level security through application logic
3. **API Layer**: Next.js API Routes with authentication and authorization middleware
4. **Presentation Layer**: React components with conditional rendering based on authentication state

### Authentication Flow

```
User Registration/Login
  ↓
Password hashing (bcrypt, 10 rounds)
  ↓
Session creation (secure, HTTP-only cookie)
  ↓
Session validation middleware
  ↓
Authorized API access
```

### Magic Link Flow

```
Admin creates Profile
  ↓
System generates crypto-secure token (32 bytes, hex)
  ↓
Token stored in Profile.magicLinkToken
  ↓
Admin shares link: /interview?token={magicLinkToken}
  ↓
Token validation on Interview Route
  ↓
Chapter creation authorized for that Profile
```


### Access Control Matrix

| Resource | Public | Authenticated User | Magic Link Holder |
|----------|--------|-------------------|-------------------|
| Human Archive (published families) | Read | Read | Read |
| Family Dashboard | None | Owner: Full CRUD | None |
| Profile Management | None | Owner: Full CRUD | None |
| Interview Route | None | None | Create Chapters |
| Chapter Playback (published) | Read | Read | Read |
| Chapter Playback (unpublished) | None | Owner: Read | None |

## Components and Interfaces

### Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  families      Family[]
}

model Family {
  id                    String   @id @default(cuid())
  adminUserId           String
  familyName            String
  isPublishedToGlobal   Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  adminUser             User     @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  profiles              Profile[]
  
  @@index([adminUserId])
  @@index([isPublishedToGlobal])
}

model Profile {
  id              String    @id @default(cuid())
  familyId        String
  name            String
  age             Int
  relation        String?
  shareSlug       String    @unique @default(cuid())
  magicLinkToken  String    @unique @default(cuid())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  family          Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  chapters        Chapter[]
  
  @@index([familyId])
  @@index([magicLinkToken])
}

model Chapter {
  id            String   @id @default(cuid())
  profileId     String
  chapterNumber Int
  title         String
  transcript    String?
  summary       String?
  audioUrl      String?
  voiceId       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  profile       Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, chapterNumber])
  @@index([profileId])
}
```


### API Routes Structure

#### Authentication Routes

**POST /api/auth/register**
- Input: `{ email: string, password: string, familyName: string }`
- Validation: Email format, password strength (min 8 chars)
- Process: Hash password, create User, create default Family
- Output: `{ userId: string, familyId: string }` + session cookie
- Status: 201 Created, 400 Bad Request, 409 Conflict (email exists)

**POST /api/auth/login**
- Input: `{ email: string, password: string }`
- Validation: Credentials match
- Process: Verify password hash, create session
- Output: `{ userId: string }` + session cookie
- Status: 200 OK, 401 Unauthorized

**POST /api/auth/logout**
- Input: None (session cookie)
- Process: Destroy session
- Output: `{ success: true }`
- Status: 200 OK

**GET /api/auth/session**
- Input: None (session cookie)
- Process: Validate session
- Output: `{ userId: string, email: string }` or `null`
- Status: 200 OK

#### Family Management Routes

**GET /api/families**
- Auth: Required (session)
- Process: Fetch families where adminUserId = current user
- Output: `Family[]`
- Status: 200 OK, 401 Unauthorized

**POST /api/families**
- Auth: Required (session)
- Input: `{ familyName: string }`
- Process: Create Family with adminUserId = current user
- Output: `Family`
- Status: 201 Created, 401 Unauthorized

**PATCH /api/families/[id]**
- Auth: Required (session + ownership check)
- Input: `{ familyName?: string, isPublishedToGlobal?: boolean }`
- Process: Update Family if adminUserId = current user
- Output: `Family`
- Status: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

**DELETE /api/families/[id]**
- Auth: Required (session + ownership check)
- Process: Cascade delete Family, Profiles, Chapters
- Output: `{ success: true }`
- Status: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found


#### Profile Management Routes

**GET /api/profiles**
- Auth: Required (session)
- Process: Fetch Profiles where family.adminUserId = current user
- Output: `Profile[]` (with family and chapters)
- Status: 200 OK, 401 Unauthorized

**POST /api/profiles**
- Auth: Required (session + family ownership check)
- Input: `{ familyId: string, name: string, age: number, relation?: string }`
- Process: Verify family ownership, generate magicLinkToken (crypto.randomBytes(32).toString('hex')), create Profile
- Output: `Profile` (including magicLinkToken)
- Status: 201 Created, 401 Unauthorized, 403 Forbidden

**GET /api/profiles/[id]**
- Auth: Required (session + ownership check)
- Process: Fetch Profile if family.adminUserId = current user
- Output: `Profile` (with chapters)
- Status: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

**PATCH /api/profiles/[id]**
- Auth: Required (session + ownership check)
- Input: `{ name?: string, age?: number, relation?: string }`
- Process: Update Profile if family.adminUserId = current user
- Output: `Profile`
- Status: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

**DELETE /api/profiles/[id]**
- Auth: Required (session + ownership check)
- Process: Cascade delete Profile and Chapters
- Output: `{ success: true }`
- Status: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

**POST /api/profiles/[id]/regenerate-token**
- Auth: Required (session + ownership check)
- Process: Generate new magicLinkToken
- Output: `{ magicLinkToken: string }`
- Status: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found


#### Chapter Management Routes

**POST /api/chapters**
- Auth: Magic Link Token (query param or header)
- Input: `{ token: string, title: string, transcript?: string, summary?: string, audioUrl?: string, voiceId?: string }`
- Process: Validate token, find Profile, create Chapter
- Output: `Chapter`
- Status: 201 Created, 403 Forbidden (invalid token)

**GET /api/chapters/[id]**
- Auth: Conditional (public if published, session + ownership if unpublished)
- Process: Fetch Chapter, check visibility
- Output: `Chapter`
- Status: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

#### Public Routes

**GET /api/human-archive**
- Auth: None (public)
- Process: Fetch Families where isPublishedToGlobal = true, include Profiles and Chapters
- Output: `Family[]`
- Status: 200 OK

**GET /api/book/[shareSlug]**
- Auth: None (public)
- Process: Fetch Profile by shareSlug, check if family.isPublishedToGlobal = true
- Output: `Profile` (with chapters)
- Status: 200 OK, 404 Not Found (unpublished or doesn't exist)

### Middleware Components

#### Authentication Middleware (`lib/auth/middleware.ts`)

```typescript
export async function requireAuth(req: NextRequest): Promise<User | null> {
  const sessionCookie = req.cookies.get('session')?.value;
  if (!sessionCookie) return null;
  
  // Validate session (implementation depends on session strategy)
  const userId = await validateSession(sessionCookie);
  if (!userId) return null;
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function requireFamilyOwnership(
  familyId: string, 
  userId: string
): Promise<boolean> {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { adminUserId: true }
  });
  return family?.adminUserId === userId;
}

export async function requireProfileOwnership(
  profileId: string, 
  userId: string
): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { family: { select: { adminUserId: true } } }
  });
  return profile?.family.adminUserId === userId;
}
```


#### Magic Link Validation Middleware (`lib/auth/magic-link.ts`)

```typescript
export async function validateMagicLink(token: string): Promise<Profile | null> {
  if (!token || token.length !== 64) return null; // 32 bytes hex = 64 chars
  
  const profile = await prisma.profile.findUnique({
    where: { magicLinkToken: token },
    include: { family: true }
  });
  
  return profile;
}

export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

### Session Management Strategy

We'll use a simple session table approach for SQLite compatibility:

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}
```

Session lifecycle:
- **Creation**: Generate secure random token (32 bytes), store with 30-day expiration
- **Validation**: Check token exists and expiresAt > now()
- **Renewal**: Update expiresAt on each authenticated request (sliding window)
- **Destruction**: Delete session record on logout

## Data Models

### User Model
- **id**: Unique identifier (cuid)
- **email**: Unique email address for login
- **passwordHash**: Bcrypt hash (10 rounds) of user password
- **createdAt**: Account creation timestamp
- **updatedAt**: Last modification timestamp
- **families**: One-to-many relationship with Family

### Family Model
- **id**: Unique identifier (cuid)
- **adminUserId**: Foreign key to User (owner)
- **familyName**: Display name for the family collection
- **isPublishedToGlobal**: Boolean flag for Human Archive visibility
- **createdAt**: Creation timestamp
- **updatedAt**: Last modification timestamp
- **adminUser**: Many-to-one relationship with User
- **profiles**: One-to-many relationship with Profile

### Profile Model (Enhanced)
- **id**: Unique identifier (cuid)
- **familyId**: Foreign key to Family (NEW)
- **name**: Storyteller's name
- **age**: Storyteller's age
- **relation**: Optional relationship descriptor (e.g., "Grandfather")
- **shareSlug**: Public URL identifier (existing, for backward compatibility)
- **magicLinkToken**: Cryptographically secure token for interview access (NEW)
- **createdAt**: Creation timestamp
- **updatedAt**: Last modification timestamp
- **family**: Many-to-one relationship with Family (NEW)
- **chapters**: One-to-many relationship with Chapter

### Chapter Model (Unchanged)
- **id**: Unique identifier (cuid)
- **profileId**: Foreign key to Profile
- **chapterNumber**: Sequential chapter number within profile
- **title**: Chapter title
- **transcript**: Full interview transcript
- **summary**: LLM-generated summary for agent memory
- **audioUrl**: URL to cloned voice audio (Vercel Blob)
- **voiceId**: ElevenLabs voice ID
- **createdAt**: Creation timestamp
- **updatedAt**: Last modification timestamp
- **profile**: Many-to-one relationship with Profile


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 6.5 and 2.4 both test flag toggling (consolidated into Property 2)
- Properties 8.6 and 2.5 both test cascade deletion (consolidated into Property 3)
- Properties 9.2, 2.3, and 3.4 all test ownership verification (consolidated into Property 4)
- Properties 9.3, 5.1, 5.2, and 5.3 all test visibility filtering (consolidated into Property 11)
- Properties 9.4, 4.4, and 7.1 all test token validation (consolidated into Property 8)
- Properties 10.5 and 3.5 both test token entropy (consolidated into Property 7)

The following properties provide unique validation value:

### Property 1: User Registration Round Trip

*For any* valid email and password combination, registering a user then querying the database should return a user record with that email and a hashed password (not plaintext).

**Validates: Requirements 1.1, 1.4, 10.3**

### Property 2: Authentication Session Lifecycle

*For any* user account, the sequence of login → authenticated request → logout → authenticated request should succeed for the first authenticated request and fail for the second.

**Validates: Requirements 1.2, 1.3, 1.5, 1.6**

### Property 3: Family Cascade Deletion

*For any* family with associated profiles and chapters, deleting the family should result in all profiles and chapters also being deleted from the database.

**Validates: Requirements 2.5, 8.6**

### Property 4: Family Ownership Authorization

*For any* two distinct users A and B, if user A creates a family, then user B should not be able to modify or delete that family.

**Validates: Requirements 2.3, 3.4, 9.2**

### Property 5: Family Default Publish State

*For any* newly created family, the is_published_to_global flag should be FALSE immediately after creation.

**Validates: Requirements 2.2**

### Property 6: Family Publish Toggle

*For any* family owned by a user, that user should be able to toggle the is_published_to_global flag from FALSE to TRUE and back to FALSE.

**Validates: Requirements 2.4, 6.5**

### Property 7: Magic Link Token Entropy

*For any* set of N profiles (where N ≥ 100), all magic link tokens should be unique, 64 characters long (32 bytes hex-encoded), and contain only hexadecimal characters.

**Validates: Requirements 3.2, 3.5, 10.5**

### Property 8: Magic Link Token Validation

*For any* profile with a magic link token, requests to the interview route with that token should be authorized, while requests with any other token (including random 64-char hex strings) should be rejected with 403 status.

**Validates: Requirements 4.1, 4.3, 4.4, 7.1, 9.4**


### Property 9: Chapter Creation Authorization

*For any* profile, chapters should only be creatable when providing a valid magic link token for that specific profile, and should be rejected when using no token, an invalid token, or a token belonging to a different profile.

**Validates: Requirements 4.5, 7.2, 7.3, 7.4**

### Property 10: Chapter Data Persistence

*For any* chapter created with transcript, summary, audioUrl, and voiceId fields, querying that chapter from the database should return all fields with their original values intact.

**Validates: Requirements 7.5**

### Property 11: Published Family Visibility

*For any* set of families where some have is_published_to_global = TRUE and others have is_published_to_global = FALSE, the Human Archive endpoint should return only the published families and their associated profiles and chapters.

**Validates: Requirements 5.1, 5.2, 5.3, 9.3**

### Property 12: Publish State Transition Visibility

*For any* family, if it is published (visible on Human Archive), then unpublished, then queried again, it should be visible in the first query and hidden in the second query.

**Validates: Requirements 5.5**

### Property 13: Unauthenticated Write Prevention

*For any* unauthenticated request attempting to create, update, or delete families, profiles, or chapters (excluding magic-link-authorized chapter creation), the API should reject the request with 401 status.

**Validates: Requirements 5.4, 9.1**

### Property 14: Family Data Isolation

*For any* two distinct authenticated users A and B with their own families, user A's dashboard queries should return only families, profiles, and chapters owned by A, and user B's queries should return only data owned by B, with no overlap.

**Validates: Requirements 6.2**

### Property 15: Profile-Family Association

*For any* profile created by a user, the profile's family_id should reference a family where admin_user_id equals the creating user's id.

**Validates: Requirements 2.1, 3.1**

### Property 16: Profile Attribute Persistence

*For any* profile created with name, age, and relation attributes, querying that profile should return all three attributes with their original values.

**Validates: Requirements 3.3**

### Property 17: Session Expiration

*For any* session created at time T with expiration duration D, attempting to use that session at time T + D + 1 should result in authentication failure.

**Validates: Requirements 10.2**

### Property 18: Password Hash Sanitization

*For any* user record retrieved via API, the response should not contain the passwordHash field.

**Validates: Requirements 10.4**

### Property 19: HTTP Status Code Correctness

*For any* API request, the response status code should be 401 when authentication is required but not provided, 403 when authentication is provided but authorization fails, and 404 when a requested resource does not exist.

**Validates: Requirements 9.5**

### Property 20: Family Dashboard Preview Consistency

*For any* family owned by a user, the data shown in the preview function should match exactly the data returned by the public Human Archive endpoint when that family is published.

**Validates: Requirements 11.5**


## UI Component Architecture

### Page Components

#### 1. Human Archive (Public) - `/` (Modified)

**Access**: Public (no authentication required)

**Data Source**: `GET /api/human-archive` (filters for isPublishedToGlobal = true)

**Components**:
- `HumanArchiveGrid`: Displays published families as cards
- `FamilyCard`: Shows family name, profile count, chapter count
- `ProfilePreview`: Clickable profile cards linking to `/book/[shareSlug]`

**Behavior**:
- No "New Profile" button for unauthenticated users
- Add "Login" and "Sign Up" buttons in header
- Display only published content
- Read-only interface (no edit/delete actions)

#### 2. Authentication Pages

**`/auth/register`**
- Form: email, password, confirm password, family name
- Validation: email format, password strength (min 8 chars), passwords match
- On success: Create user + default family, redirect to `/dashboard`

**`/auth/login`**
- Form: email, password
- On success: Establish session, redirect to `/dashboard`

**`/auth/logout`**
- POST to `/api/auth/logout`
- Clear session, redirect to `/`

#### 3. Family Dashboard (Private) - `/dashboard`

**Access**: Authenticated users only (redirect to `/auth/login` if not authenticated)

**Data Source**: `GET /api/families` (returns only user's families)

**Components**:
- `FamilySelector`: Dropdown if user has multiple families
- `FamilySettings`: Toggle publish status, edit family name
- `ProfileList`: Grid of profiles within selected family
- `ProfileCard`: Shows profile info + "View Magic Link" button
- `NewProfileButton`: Opens profile creation modal

**Behavior**:
- Display user's email and logout button in header
- Show publish status with toggle switch
- Display magic link in copyable text field when requested
- Link to `/dashboard/profiles/[id]` for profile details

#### 4. Profile Dashboard (Private) - `/dashboard/profiles/[id]`

**Access**: Authenticated users only + ownership check

**Data Source**: `GET /api/profiles/[id]` (with ownership validation)

**Components**:
- `ProfileHeader`: Name, age, relation, edit button
- `MagicLinkDisplay`: Copyable link with regenerate button
- `ChapterList`: All chapters with playback controls
- `StartInterviewButton`: Links to `/interview?token=[magicLinkToken]`

**Behavior**:
- Verify user owns the profile's family
- Display all chapters (including unpublished)
- Allow chapter deletion
- Show preview of public audiobook view

#### 5. Interview Room (Magic Link) - `/interview?token=[magicLinkToken]`

**Access**: Valid magic link token required (no authentication)

**Data Source**: Token validation via `validateMagicLink(token)`

**Components**:
- `InterviewInterface`: ElevenLabs conversation UI (existing)
- `TokenValidator`: Validates token on page load

**Behavior**:
- Validate token on mount, show error if invalid
- Pass profileId from validated token to interview flow
- On interview completion, create chapter with token in request
- Redirect to success page (not dashboard, since user may not be authenticated)

#### 6. Public Audiobook - `/book/[shareSlug]` (Modified)

**Access**: Public (but only if family is published)

**Data Source**: `GET /api/book/[shareSlug]` (checks isPublishedToGlobal)

**Components**:
- `AudiobookPlayer`: Existing component (unchanged)
- `ChapterList`: Existing component (unchanged)

**Behavior**:
- Return 404 if profile's family is not published
- Read-only interface (no edit actions)
- Display "Created with Echoes of Us" footer

### Component Hierarchy

```
App
├── PublicLayout
│   ├── HumanArchive (/)
│   └── PublicAudiobook (/book/[shareSlug])
├── AuthLayout
│   ├── Register (/auth/register)
│   ├── Login (/auth/login)
│   └── Logout (/auth/logout)
├── DashboardLayout (requires auth)
│   ├── FamilyDashboard (/dashboard)
│   └── ProfileDashboard (/dashboard/profiles/[id])
└── InterviewLayout (requires magic link)
    └── InterviewRoom (/interview?token=...)
```

