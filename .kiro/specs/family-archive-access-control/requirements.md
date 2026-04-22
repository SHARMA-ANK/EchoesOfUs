# Requirements Document

## Introduction

The Echoes of Us application currently operates as an open system where anyone can create profiles and record chapters without authentication or access control. This feature introduces a secure "Family Archive" architecture that implements user authentication, family-based organization, and granular access controls to protect private family memories while enabling selective public sharing.

## Glossary

- **Admin_User**: An authenticated user who owns and manages a Family Archive
- **Family_Archive**: A collection of Profiles managed by a single Admin_User with configurable visibility
- **Profile**: A storyteller within a Family_Archive (e.g., "Grandpa Joe, 82")
- **Chapter**: An audio recording and transcript created during an interview session
- **Magic_Link**: A unique, unguessable URL token that grants access to a specific Profile's interview interface
- **Human_Archive**: The public-facing gallery displaying only published Family_Archives
- **Family_Dashboard**: The private administrative interface for managing a Family_Archive
- **Interview_Route**: The recording interface accessible only via Magic_Link
- **Published_Status**: A boolean flag indicating whether a Family_Archive is visible on the Human_Archive

## Requirements

### Requirement 1: User Authentication System

**User Story:** As a family member, I want to create an account and log in, so that I can securely manage my family's stories.

#### Acceptance Criteria

1. THE Authentication_System SHALL provide user registration with email and password
2. THE Authentication_System SHALL provide user login with email and password
3. THE Authentication_System SHALL maintain secure session management for authenticated users
4. WHEN a user successfully registers, THE Authentication_System SHALL create a user record with a unique identifier
5. WHEN a user successfully logs in, THE Authentication_System SHALL establish an authenticated session
6. THE Authentication_System SHALL provide logout functionality that terminates the user session

### Requirement 2: Family Archive Management

**User Story:** As an admin user, I want to create and manage my Family Archive, so that I can organize my family's profiles under one collection.

#### Acceptance Criteria

1. WHEN an authenticated Admin_User creates a Family_Archive, THE System SHALL store the family_name and link it to the admin_user_id
2. THE System SHALL initialize the is_published_to_global flag to FALSE for new Family_Archives
3. THE System SHALL allow only the Admin_User to modify their Family_Archive settings
4. THE System SHALL allow the Admin_User to toggle the is_published_to_global flag
5. WHEN a Family_Archive is deleted, THE System SHALL cascade delete all associated Profiles and Chapters

### Requirement 3: Profile Management with Family Association

**User Story:** As an admin user, I want to create profiles for family members within my Family Archive, so that each person can have their own interview space.

#### Acceptance Criteria

1. WHEN an Admin_User creates a Profile, THE System SHALL associate it with their Family_Archive via family_id
2. THE System SHALL generate a unique magic_link_token for each Profile
3. THE System SHALL store Profile attributes including name, age, and relation
4. THE System SHALL allow only the owning Admin_User to create, update, or delete Profiles within their Family_Archive
5. WHEN a Profile is created, THE Magic_Link_Generator SHALL produce a cryptographically secure, unguessable token

### Requirement 4: Magic Link Access Control

**User Story:** As an admin user, I want to share a unique link with a family member, so that they can record their story without needing to create an account.

#### Acceptance Criteria

1. WHEN a request is made to the Interview_Route with a valid magic_link_token, THE System SHALL grant access to that Profile's interview interface
2. WHEN a request is made to the Interview_Route without a magic_link_token, THE System SHALL deny access
3. WHEN a request is made to the Interview_Route with an invalid magic_link_token, THE System SHALL deny access
4. THE System SHALL validate the magic_link_token against the database before granting access
5. THE Interview_Route SHALL allow Chapter creation only when accessed via a valid magic_link_token

### Requirement 5: Public Human Archive with Visibility Controls

**User Story:** As a visitor, I want to browse published family stories on the Human Archive, so that I can discover and listen to shared memories.

#### Acceptance Criteria

1. THE Human_Archive SHALL display only Family_Archives where is_published_to_global is TRUE
2. THE Human_Archive SHALL display only Profiles belonging to published Family_Archives
3. THE Human_Archive SHALL allow visitors to view and play Chapters from published Profiles
4. THE Human_Archive SHALL prevent visitors from creating, editing, or deleting any content
5. WHEN a Family_Archive is unpublished, THE Human_Archive SHALL immediately hide it and all associated Profiles

### Requirement 6: Private Family Dashboard Access Control

**User Story:** As an admin user, I want a private dashboard to manage my family's profiles, so that I can control what gets published.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access the Family_Dashboard, THE System SHALL redirect them to the login page
2. WHEN an authenticated Admin_User accesses the Family_Dashboard, THE System SHALL display only their Family_Archive and associated Profiles
3. THE Family_Dashboard SHALL allow the Admin_User to create new Profiles
4. THE Family_Dashboard SHALL allow the Admin_User to view Magic_Links for their Profiles
5. THE Family_Dashboard SHALL allow the Admin_User to toggle the is_published_to_global flag
6. THE Family_Dashboard SHALL display all Chapters for each Profile with playback controls

### Requirement 7: Chapter Creation Security

**User Story:** As an admin user, I want to ensure only authorized people can add chapters to profiles, so that my family's archive remains secure.

#### Acceptance Criteria

1. WHEN a Chapter creation request is received, THE API SHALL validate the magic_link_token
2. IF the magic_link_token is invalid, THEN THE API SHALL reject the Chapter creation request with a 403 error
3. IF the magic_link_token is valid, THEN THE API SHALL associate the Chapter with the corresponding Profile
4. THE API SHALL prevent Chapter creation via any route other than the Magic_Link-authenticated Interview_Route
5. THE API SHALL store the Chapter with transcript, summary, audio_url, and voice_id

### Requirement 8: Database Schema Migration

**User Story:** As a developer, I want to migrate the existing database schema to support the Family Archive structure, so that the system can enforce access controls.

#### Acceptance Criteria

1. THE Migration SHALL create a Users table with id, email, password_hash, and timestamps
2. THE Migration SHALL create a Families table with id, admin_user_id, family_name, is_published_to_global, and timestamps
3. THE Migration SHALL add family_id and magic_link_token columns to the Profiles table
4. THE Migration SHALL maintain the existing Chapters table structure with foreign key to Profiles
5. THE Migration SHALL establish foreign key relationships: Families.admin_user_id → Users.id, Profiles.family_id → Families.id
6. THE Migration SHALL set appropriate cascade delete rules for referential integrity

### Requirement 9: API Route Protection

**User Story:** As a developer, I want to secure all API routes with appropriate authentication checks, so that unauthorized users cannot access or modify data.

#### Acceptance Criteria

1. THE API SHALL protect Family and Profile management routes with authentication middleware
2. THE API SHALL verify the authenticated user owns the Family_Archive before allowing modifications
3. THE API SHALL allow public read access only to Profiles and Chapters where is_published_to_global is TRUE
4. THE API SHALL validate magic_link_token for Interview_Route and Chapter creation endpoints
5. THE API SHALL return appropriate HTTP status codes (401 for unauthenticated, 403 for unauthorized, 404 for not found)

### Requirement 10: Session Management and Security

**User Story:** As an admin user, I want my login session to be secure and persistent, so that I don't have to log in repeatedly while maintaining security.

#### Acceptance Criteria

1. THE Authentication_System SHALL use secure, HTTP-only cookies for session management
2. THE Authentication_System SHALL set appropriate session expiration timeouts
3. THE Authentication_System SHALL hash passwords using a secure algorithm before storage
4. THE Authentication_System SHALL never expose password hashes in API responses
5. THE Magic_Link_Generator SHALL generate tokens with sufficient entropy to prevent guessing attacks

### Requirement 11: User Flow Integration

**User Story:** As an admin user, I want a seamless workflow from account creation to sharing interview links, so that I can quickly set up my family archive.

#### Acceptance Criteria

1. WHEN a new user registers, THE System SHALL guide them to create their first Family_Archive
2. WHEN a Family_Archive is created, THE System SHALL redirect the Admin_User to the Family_Dashboard
3. WHEN a Profile is created, THE System SHALL display the Magic_Link prominently for sharing
4. THE System SHALL provide clear visual indicators of published vs unpublished status
5. THE System SHALL allow the Admin_User to preview how their Family_Archive appears on the Human_Archive

### Requirement 12: Backward Compatibility and Data Migration

**User Story:** As a developer, I want to migrate existing profiles and chapters to the new schema, so that no data is lost during the refactoring.

#### Acceptance Criteria

1. THE Migration SHALL preserve all existing Profile records with their id, name, age, and relation
2. THE Migration SHALL preserve all existing Chapter records with their associations to Profiles
3. WHERE existing Profiles lack a family_id, THE Migration SHALL create a default Family_Archive or mark them for manual assignment
4. THE Migration SHALL generate magic_link_tokens for all existing Profiles
5. THE Migration SHALL maintain all existing shareSlug values for backward compatibility with external links

