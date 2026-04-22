# Design Document: Chapter Playback

## Overview

The Chapter Playback feature adds audio playback capabilities to the profile dashboard, enabling users to listen to their recorded legacy chapters. This design integrates a custom audio player component into existing chapter cards, providing standard playback controls (play/pause, seek, progress tracking) while maintaining the application's cinematic design aesthetic.

The implementation leverages the Web Audio API through HTML5 `<audio>` elements, manages playback state with React hooks, and coordinates multiple player instances to ensure only one chapter plays at a time. Audio files are served from Vercel Blob Storage using pre-existing audioUrl values stored in the database.

### Key Design Decisions

1. **Client-Side Audio Playback**: Use native HTML5 audio elements rather than third-party libraries to minimize dependencies and leverage browser-native capabilities
2. **Component-Based Architecture**: Create a reusable `AudioPlayer` component that can be embedded in any chapter card
3. **Centralized State Management**: Implement a context provider to coordinate playback across multiple player instances
4. **Progressive Enhancement**: Ensure the UI remains functional even if audio fails to load
5. **Mobile-First Responsive Design**: Design touch-friendly controls that work seamlessly on mobile devices

## Architecture

### High-Level Component Structure

```
ProfileDashboardPage (app/profiles/[id]/page.tsx)
├── AudioPlayerProvider (context for coordinating multiple players)
│   └── provides: currentPlayingId, setCurrentPlayingId
├── Profile Header Section
└── Chapters Section
    └── ChapterCard (for each chapter)
        └── AudioPlayer (if audioUrl exists)
            ├── PlayPauseButton
            ├── ProgressBar
            ├── TimeDisplay
            └── ErrorBoundary
```

### Data Flow

1. **Initial Load**: Profile page fetches profile data including chapters with audioUrl values
2. **Player Initialization**: Each AudioPlayer component receives audioUrl as a prop
3. **Playback Control**: User clicks play → AudioPlayer notifies context → context pauses other players → audio begins
4. **Progress Updates**: Audio element fires timeupdate events → component updates progress bar and time display
5. **Seek Operation**: User interacts with progress bar → component updates audio.currentTime → playback continues from new position

### State Management Strategy

**Local Component State** (within AudioPlayer):
- `isPlaying: boolean` - current play/pause state
- `currentTime: number` - current playback position in seconds
- `duration: number` - total audio duration in seconds
- `isLoading: boolean` - whether audio metadata is loading
- `error: string | null` - error message if playback fails

**Global Context State** (AudioPlayerProvider):
- `currentPlayingId: string | null` - ID of the currently playing chapter
- `setCurrentPlayingId: (id: string | null) => void` - function to update playing state

### Technology Stack

- **React 19.2.4**: Component framework with hooks for state management
- **Next.js 16.2.4**: App Router for routing and server components
- **TypeScript 5**: Type safety for props and state
- **Tailwind CSS 4**: Utility-first styling matching existing design system
- **HTML5 Audio API**: Native browser audio playback
- **Vercel Blob Storage**: Audio file hosting (already configured)

## Components and Interfaces

### 1. AudioPlayerProvider (Context)

**Purpose**: Coordinate playback across multiple AudioPlayer instances to ensure only one plays at a time.

**Location**: `app/components/AudioPlayerProvider.tsx` (new file)

**Interface**:
```typescript
interface AudioPlayerContextValue {
  currentPlayingId: string | null;
  setCurrentPlayingId: (id: string | null) => void;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }): JSX.Element;
export function useAudioPlayer(): AudioPlayerContextValue;
```

**Responsibilities**:
- Maintain global state of which chapter is currently playing
- Provide context to all AudioPlayer components
- Reset playing state when user navigates away

### 2. AudioPlayer Component

**Purpose**: Render audio playback controls for a single chapter.

**Location**: `app/components/AudioPlayer.tsx` (new file)

**Props Interface**:
```typescript
interface AudioPlayerProps {
  chapterId: string;
  audioUrl: string;
  chapterTitle: string; // for accessibility labels
}
```

**State Interface**:
```typescript
interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
}
```

**Responsibilities**:
- Render play/pause button, progress bar, and time display
- Manage local playback state
- Handle audio element events (play, pause, timeupdate, ended, error)
- Communicate with AudioPlayerProvider to pause other players
- Handle loading and error states gracefully

**Key Methods**:
- `handlePlayPause()`: Toggle play/pause state and notify context
- `handleSeek(time: number)`: Update audio currentTime
- `handleTimeUpdate()`: Update progress bar as audio plays
- `handleError(error: Event)`: Display error message and provide retry option
- `formatTime(seconds: number)`: Convert seconds to MM:SS format

### 3. PlayPauseButton Component

**Purpose**: Render play or pause icon based on current state.

**Location**: Inline within AudioPlayer component (not extracted)

**Props Interface**:
```typescript
interface PlayPauseButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  onClick: () => void;
}
```

**Visual States**:
- **Play Icon**: Displayed when audio is paused or stopped
- **Pause Icon**: Displayed when audio is playing
- **Loading Spinner**: Displayed when audio is buffering

### 4. ProgressBar Component

**Purpose**: Display playback progress and allow seeking.

**Location**: Inline within AudioPlayer component (not extracted)

**Props Interface**:
```typescript
interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}
```

**Interaction Modes**:
- **Click**: Jump to clicked position
- **Drag**: Scrub through audio (desktop)
- **Touch**: Scrub through audio (mobile)

### 5. TimeDisplay Component

**Purpose**: Show current time and total duration.

**Location**: Inline within AudioPlayer component (not extracted)

**Props Interface**:
```typescript
interface TimeDisplayProps {
  currentTime: number;
  duration: number;
}
```

**Format**: `MM:SS / MM:SS` (e.g., "02:34 / 05:12")

### 6. Modified ChapterCard

**Purpose**: Integrate AudioPlayer into existing chapter card layout.

**Location**: `app/profiles/[id]/page.tsx` (modified)

**Changes**:
- Add conditional rendering: if `chapter.audioUrl` exists, render AudioPlayer
- If no audioUrl, display "Audio unavailable" message
- Maintain existing chapter number and title display
- Preserve hover effects and styling

## Data Models

### Existing Database Schema (No Changes Required)

The Chapter model already contains the necessary fields:

```prisma
model Chapter {
  id            String   @id @default(cuid())
  profileId     String
  chapterNumber Int
  title         String
  transcript    String?
  summary       String?
  audioUrl      String?  // ← Used by AudioPlayer
  voiceId       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  profile       Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, chapterNumber])
}
```

### Client-Side Type Definitions

**Chapter Interface** (already exists in page.tsx):
```typescript
interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  audioUrl: string | null;
}
```

**Audio Element Ref**:
```typescript
const audioRef = useRef<HTMLAudioElement>(null);
```

### Environment Variables

**Required** (already configured):
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob Storage access token

**Verification**: The system should verify this token exists during build/startup (already handled by existing upload functionality).


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the following redundancies were identified and resolved:

- **Time Formatting (3.2 & 3.3)**: Both test the same MM:SS formatting function with different inputs (currentTime vs duration). Combined into a single property that tests the formatting function works for any time value.
- **Seek Interactions (4.1 & 4.2)**: Click and drag both test the same underlying seek mechanism. Combined into a single property that tests seeking works regardless of interaction method.
- **Design Color Verification (1.3 & 3.4)**: Both verify specific color values are used. Combined into a single example test.

### Property 1: AudioPlayer renders when audioUrl exists

*For any* chapter with a non-null audioUrl value, rendering the chapter card should include an AudioPlayer component.

**Validates: Requirements 1.1**

### Property 2: Initial state shows play button

*For any* newly mounted AudioPlayer component, the initial render should display a play button (not pause).

**Validates: Requirements 1.2**

### Property 3: Missing audioUrl shows unavailable message

*For any* chapter with a null or undefined audioUrl value, the chapter card should display an "audio unavailable" message instead of an AudioPlayer.

**Validates: Requirements 1.4**

### Property 4: Play button triggers audio playback

*For any* AudioPlayer with a valid audioUrl, clicking the play button should invoke the audio element's play() method and transition to playing state.

**Validates: Requirements 2.1**

### Property 5: Playing state shows pause button

*For any* AudioPlayer in playing state (isPlaying === true), the button should display a pause icon instead of a play icon.

**Validates: Requirements 2.2**

### Property 6: Pause button stops playback

*For any* AudioPlayer in playing state, clicking the pause button should invoke the audio element's pause() method and preserve the current time position.

**Validates: Requirements 2.3**

### Property 7: Play-pause-play preserves position (Round Trip)

*For any* AudioPlayer, the sequence of play → pause → play should result in audio resuming from the same time position where it was paused.

**Validates: Requirements 2.4**

### Property 8: Audio completion resets to initial state

*For any* AudioPlayer that plays audio to completion (ended event), the component should reset to initial state with isPlaying === false and display a play button.

**Validates: Requirements 2.5**

### Property 9: Progress bar updates during playback

*For any* AudioPlayer in playing state, timeupdate events should cause the progress bar to update its visual position to reflect currentTime / duration.

**Validates: Requirements 3.1**

### Property 10: Time formatting produces MM:SS format

*For any* time value in seconds (0 to 3599), the formatTime function should produce a string matching the pattern MM:SS where MM is zero-padded minutes and SS is zero-padded seconds.

**Validates: Requirements 3.2, 3.3**

### Property 11: Seeking updates playback position

*For any* user interaction with the progress bar (click or drag), the audio element's currentTime should update to match the selected position.

**Validates: Requirements 4.1, 4.2**

### Property 12: Seeking preserves play/pause state (Invariant)

*For any* AudioPlayer, performing a seek operation should not change the isPlaying state—if playing before seek, continue playing; if paused before seek, remain paused.

**Validates: Requirements 4.3**

### Property 13: Loading state displays during initialization

*For any* AudioPlayer, when play() is invoked before audio metadata is loaded, the component should display a loading indicator until the canplay event fires.

**Validates: Requirements 5.1**

### Property 14: Metadata load populates duration

*For any* AudioPlayer, when the loadedmetadata event fires, the duration state should be populated with the audio element's duration value.

**Validates: Requirements 5.2**

### Property 15: Invalid audioUrl triggers error message

*For any* AudioPlayer with an invalid or inaccessible audioUrl, the error event should trigger and display an error message "Unable to load audio".

**Validates: Requirements 6.1**

### Property 16: Error state provides retry button

*For any* AudioPlayer in an error state (error !== null), the component should render a retry button that allows the user to attempt playback again.

**Validates: Requirements 6.4**

### Property 17: Starting one player pauses others

*For any* two AudioPlayer instances on the same page, when one transitions to playing state, any other player in playing state should automatically pause.

**Validates: Requirements 7.1**

### Property 18: Each player maintains independent state

*For any* AudioPlayer instance, its playback state (currentTime, duration, isPlaying) should be independent and not affected by other players' state changes (except for the play/pause coordination).

**Validates: Requirements 7.2**

### Property 19: Unmounting stops all playback

*For any* ProfileDashboardPage component, when it unmounts (user navigates away), all AudioPlayer instances should stop playback and clean up audio resources.

**Validates: Requirements 7.3**

### Property 20: AudioPlayer uses provided audioUrl prop

*For any* AudioPlayer component, the audio element's src attribute should be set to the audioUrl prop value.

**Validates: Requirements 8.1**

### Property 21: Touch gestures enable seeking on mobile

*For any* AudioPlayer rendered on a touch device, touch events on the progress bar should trigger seek operations equivalent to mouse interactions.

**Validates: Requirements 9.3**

### Property 22: Chapter information remains visible

*For any* chapter card containing an AudioPlayer, the chapter number and title should remain visible and not be obscured by the player UI.

**Validates: Requirements 10.1**


## Error Handling

### Error Categories and Responses

**1. Audio Loading Errors**
- **Cause**: Invalid audioUrl, network failure, CORS issues, missing Blob token
- **Detection**: Audio element `error` event
- **Response**: Display "Unable to load audio" message with retry button
- **User Action**: Click retry to attempt reload

**2. Playback Interruption Errors**
- **Cause**: Network disconnection during playback, buffer underrun
- **Detection**: Audio element `stalled` or `error` events during playback
- **Response**: Display "Playback interrupted" message with retry button
- **User Action**: Click retry to resume from last position

**3. Timeout Errors**
- **Cause**: Audio metadata fails to load within 10 seconds
- **Detection**: setTimeout in useEffect after play() invocation
- **Response**: Display timeout error message with retry button
- **User Action**: Click retry or refresh page

**4. Authentication Errors**
- **Cause**: Missing or invalid BLOB_READ_WRITE_TOKEN
- **Detection**: HTTP 401/403 response from Vercel Blob
- **Response**: Display "Audio access denied" message
- **User Action**: Contact support (no retry, requires configuration fix)

### Error State Management

```typescript
interface ErrorState {
  type: 'loading' | 'playback' | 'timeout' | 'auth' | null;
  message: string;
  retryable: boolean;
}
```

**Error Recovery Flow**:
1. Error occurs → audio element fires error event
2. Component captures error and determines type
3. Component sets error state with appropriate message
4. UI displays error message and retry button (if retryable)
5. User clicks retry → component resets error state and attempts playback again
6. If retry fails 3 times → display persistent error with "Contact support" message

### Graceful Degradation

- **No JavaScript**: Audio player will not render, but chapter information remains visible
- **Old Browsers**: Feature detection for HTML5 audio; display "Browser not supported" message if unavailable
- **Slow Networks**: Display loading indicator indefinitely; user can cancel by clicking pause
- **Missing Audio Files**: Display "Audio unavailable" message; chapter card remains functional

### Error Logging

All errors should be logged to console for debugging:
```typescript
console.error('[AudioPlayer]', {
  chapterId,
  audioUrl,
  errorType,
  errorMessage,
  timestamp: new Date().toISOString()
});
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

**Library**: `fast-check` (JavaScript/TypeScript property-based testing library)

**Installation**:
```bash
npm install --save-dev fast-check @types/fast-check
```

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each test must reference its design document property
- Tag format: `Feature: chapter-playback, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

describe('AudioPlayer Property Tests', () => {
  it('Property 10: Time formatting produces MM:SS format', () => {
    // Feature: chapter-playback, Property 10: Time formatting produces MM:SS format
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3599 }), // Generate random seconds
        (seconds) => {
          const formatted = formatTime(seconds);
          const regex = /^\d{2}:\d{2}$/;
          expect(formatted).toMatch(regex);
          
          // Verify correctness
          const [mins, secs] = formatted.split(':').map(Number);
          expect(mins).toBe(Math.floor(seconds / 60));
          expect(secs).toBe(seconds % 60);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Coverage**:
- Property 1-3: Component rendering based on audioUrl presence
- Property 4-8: Play/pause state transitions
- Property 9-10: Progress and time display updates
- Property 11-12: Seek functionality and state preservation
- Property 13-16: Loading and error states
- Property 17-19: Multi-player coordination
- Property 20-22: Props usage and layout preservation

### Unit Testing

**Library**: Jest (already configured with Next.js) + React Testing Library

**Unit Test Focus Areas**:

1. **Specific Examples**:
   - Play button click triggers play() method
   - Pause button click triggers pause() method
   - Progress bar click at 50% seeks to middle of audio
   - Time display shows "00:00 / 03:45" for 3:45 duration audio

2. **Edge Cases**:
   - Audio duration of 0 seconds
   - Audio duration exceeding 1 hour (formatting edge case)
   - Seeking to position 0 (beginning)
   - Seeking to position === duration (end)
   - Rapid play/pause toggling
   - Multiple seek operations in quick succession

3. **Error Conditions**:
   - audioUrl returns 404
   - audioUrl returns 403 (auth error)
   - Network timeout after 10 seconds
   - Audio element throws error during playback
   - Retry button click after error

4. **Integration Points**:
   - AudioPlayerProvider context updates when player starts
   - Multiple AudioPlayer instances coordinate correctly
   - Component cleanup on unmount stops audio

5. **Accessibility**:
   - Play/pause button has aria-label
   - Progress bar has aria-valuemin, aria-valuemax, aria-valuenow
   - Time display has aria-live region for screen readers
   - Keyboard navigation works (Space to play/pause, Arrow keys to seek)

**Example Unit Test**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import AudioPlayer from '@/app/components/AudioPlayer';
import { AudioPlayerProvider } from '@/app/components/AudioPlayerProvider';

describe('AudioPlayer Unit Tests', () => {
  it('displays play button initially', () => {
    render(
      <AudioPlayerProvider>
        <AudioPlayer 
          chapterId="test-1" 
          audioUrl="https://example.com/audio.mp3"
          chapterTitle="Test Chapter"
        />
      </AudioPlayerProvider>
    );
    
    const playButton = screen.getByLabelText(/play/i);
    expect(playButton).toBeInTheDocument();
  });

  it('shows error message for invalid audioUrl', async () => {
    render(
      <AudioPlayerProvider>
        <AudioPlayer 
          chapterId="test-2" 
          audioUrl="https://invalid-url.com/missing.mp3"
          chapterTitle="Test Chapter"
        />
      </AudioPlayerProvider>
    );
    
    const playButton = screen.getByLabelText(/play/i);
    fireEvent.click(playButton);
    
    // Wait for error to appear
    const errorMessage = await screen.findByText(/unable to load audio/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

**Desktop Testing**:
- [ ] Play/pause button works in Chrome, Firefox, Safari
- [ ] Progress bar click seeking works
- [ ] Progress bar drag seeking works
- [ ] Time display updates correctly
- [ ] Multiple chapters coordinate (only one plays at a time)
- [ ] Error states display correctly
- [ ] Retry button works after errors
- [ ] Audio continues playing when scrolling page
- [ ] Audio stops when navigating away

**Mobile Testing**:
- [ ] Play/pause button is touch-friendly (44px minimum)
- [ ] Progress bar touch seeking works
- [ ] Progress bar drag seeking works on touch
- [ ] Layout is responsive at 320px width
- [ ] Audio continues playing when screen locks (if supported)
- [ ] Audio stops when app goes to background

**Accessibility Testing**:
- [ ] Screen reader announces play/pause state changes
- [ ] Screen reader announces time updates
- [ ] Keyboard navigation works (Tab, Space, Arrow keys)
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards

**Error Scenario Testing**:
- [ ] Invalid audioUrl shows error message
- [ ] Network disconnection during playback shows error
- [ ] Missing BLOB_READ_WRITE_TOKEN shows auth error
- [ ] Timeout after 10 seconds shows timeout error
- [ ] Retry button successfully recovers from transient errors

### Test File Organization

```
app/
├── components/
│   ├── AudioPlayer.tsx
│   ├── AudioPlayer.test.tsx          # Unit tests
│   ├── AudioPlayer.properties.test.tsx # Property tests
│   ├── AudioPlayerProvider.tsx
│   └── AudioPlayerProvider.test.tsx
└── profiles/[id]/
    └── page.test.tsx                 # Integration tests
```

### Continuous Integration

- All tests must pass before merging to main branch
- Property tests run with 100 iterations in CI
- Coverage target: 80% for AudioPlayer component
- E2E tests using Playwright for critical user flows

