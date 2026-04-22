# Requirements Document

## Introduction

The Chapter Playback feature enables users to listen to their recorded audio chapters directly from the profile dashboard. Currently, chapters are saved to the database with audio files stored in Vercel Blob Storage, but there is no playback interface. This feature will add an audio player with standard controls (play/pause, progress tracking, time display) to each chapter card, allowing users to review their recorded legacy content.

## Glossary

- **Audio_Player**: The UI component that provides playback controls for a chapter's audio file
- **Chapter_Card**: The visual container displaying chapter information on the profile dashboard
- **Profile_Dashboard**: The page displaying a profile's details and list of chapters (app/profiles/[id]/page.tsx)
- **Vercel_Blob_Storage**: Cloud storage service where audio files are permanently stored
- **Progress_Bar**: Visual indicator showing current playback position within the audio duration
- **Playback_Controls**: Interactive elements (play, pause, seek) for controlling audio playback

## Requirements

### Requirement 1: Display Audio Player on Chapter Cards

**User Story:** As a user, I want to see an audio player on each chapter card, so that I can listen to my recorded chapters.

#### Acceptance Criteria

1. WHEN the Profile_Dashboard loads with chapters that have audioUrl values, THE Audio_Player SHALL render within each Chapter_Card
2. THE Audio_Player SHALL display a play button as the initial state
3. THE Audio_Player SHALL match the cinematic design system with amber/gold accents (#D4A853) and warm off-white text (#F5ECD7)
4. WHEN a chapter has no audioUrl value, THE Audio_Player SHALL display a message indicating audio is unavailable

### Requirement 2: Control Audio Playback

**User Story:** As a user, I want to play and pause chapter audio, so that I can control when I listen to the content.

#### Acceptance Criteria

1. WHEN the user clicks the play button, THE Audio_Player SHALL begin playing the audio from the audioUrl
2. WHEN audio is playing, THE Audio_Player SHALL display a pause button instead of the play button
3. WHEN the user clicks the pause button, THE Audio_Player SHALL pause the audio at the current position
4. WHEN the user clicks play after pausing, THE Audio_Player SHALL resume playback from the paused position
5. WHEN audio playback completes, THE Audio_Player SHALL reset to the initial state with a play button

### Requirement 3: Display Playback Progress

**User Story:** As a user, I want to see how much of the chapter has played, so that I know my position in the audio.

#### Acceptance Criteria

1. WHILE audio is playing, THE Progress_Bar SHALL update continuously to reflect the current playback position
2. THE Audio_Player SHALL display the current playback time in MM:SS format
3. THE Audio_Player SHALL display the total audio duration in MM:SS format
4. THE Progress_Bar SHALL visually represent the percentage of audio played using the amber/gold accent color (#D4A853)

### Requirement 4: Seek Through Audio

**User Story:** As a user, I want to jump to different parts of the chapter, so that I can quickly find specific moments.

#### Acceptance Criteria

1. WHEN the user clicks on the Progress_Bar, THE Audio_Player SHALL seek to the corresponding time position
2. WHEN the user drags the Progress_Bar handle, THE Audio_Player SHALL update the playback position in real-time
3. WHILE seeking, THE Audio_Player SHALL maintain the playing or paused state

### Requirement 5: Handle Audio Loading States

**User Story:** As a user, I want to see when audio is loading, so that I understand the system is working.

#### Acceptance Criteria

1. WHEN the user initiates playback, THE Audio_Player SHALL display a loading indicator until audio data is ready
2. WHEN audio metadata loads, THE Audio_Player SHALL display the total duration
3. IF audio fails to load within 10 seconds, THEN THE Audio_Player SHALL display a timeout error message

### Requirement 6: Handle Audio Playback Errors

**User Story:** As a user, I want to be notified if audio cannot play, so that I understand what went wrong.

#### Acceptance Criteria

1. IF the audioUrl is invalid or inaccessible, THEN THE Audio_Player SHALL display an error message "Unable to load audio"
2. IF a network error occurs during playback, THEN THE Audio_Player SHALL display an error message "Playback interrupted"
3. IF the Vercel Blob token is missing or invalid, THEN THE Audio_Player SHALL display an error message "Audio access denied"
4. WHEN an error occurs, THE Audio_Player SHALL provide a retry button

### Requirement 7: Manage Multiple Audio Players

**User Story:** As a user, I want only one chapter to play at a time, so that audio doesn't overlap.

#### Acceptance Criteria

1. WHEN the user starts playing a chapter, THE Profile_Dashboard SHALL pause any other currently playing Audio_Player
2. THE Profile_Dashboard SHALL maintain independent playback state for each Chapter_Card
3. WHEN the user navigates away from the Profile_Dashboard, THE Audio_Player SHALL stop all playback

### Requirement 8: Verify Vercel Blob Configuration

**User Story:** As a developer, I want to ensure Vercel Blob Storage is properly configured, so that audio files are accessible.

#### Acceptance Criteria

1. THE Audio_Player SHALL use audioUrl values from Vercel_Blob_Storage
2. THE system SHALL verify that BLOB_READ_WRITE_TOKEN is configured in environment variables
3. IF the BLOB_READ_WRITE_TOKEN is missing, THEN THE system SHALL log a configuration error during build or startup

### Requirement 9: Maintain Responsive Design

**User Story:** As a user, I want the audio player to work on mobile devices, so that I can listen to chapters on any device.

#### Acceptance Criteria

1. THE Audio_Player SHALL render correctly on mobile screens (320px minimum width)
2. THE Playback_Controls SHALL be touch-friendly with minimum 44px tap targets
3. THE Progress_Bar SHALL support touch gestures for seeking on mobile devices
4. THE Audio_Player SHALL maintain the cinematic design aesthetic across all screen sizes

### Requirement 10: Preserve Existing Chapter Display

**User Story:** As a user, I want chapter information to remain visible, so that I can identify what I'm listening to.

#### Acceptance Criteria

1. THE Chapter_Card SHALL continue to display chapter number and title
2. THE Audio_Player SHALL integrate into the existing Chapter_Card layout without obscuring chapter information
3. THE Chapter_Card hover effects and styling SHALL remain functional with the Audio_Player present
