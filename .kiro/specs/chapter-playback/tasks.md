# Implementation Plan: Chapter Playback

## Overview

This implementation plan breaks down the Chapter Playback feature into discrete coding tasks. The approach follows a bottom-up strategy: build core components first, then integrate them into the existing profile dashboard, and finally add testing and polish. Each task builds incrementally to ensure the feature remains functional at every step.

## Tasks

- [x] 1. Create AudioPlayerProvider context component
  - Create `app/components/AudioPlayerProvider.tsx` with React Context
  - Implement `currentPlayingId` state management using useState
  - Export `useAudioPlayer` hook for consuming context
  - Add cleanup logic to reset state on unmount
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 1.1 Write property test for AudioPlayerProvider
  - **Property 17: Starting one player pauses others**
  - **Validates: Requirements 7.1**

- [ ] 2. Implement core AudioPlayer component
  - [x] 2.1 Create AudioPlayer component structure
    - Create `app/components/AudioPlayer.tsx` with TypeScript interfaces
    - Define AudioPlayerProps and AudioPlayerState interfaces
    - Set up component with audio element ref using useRef
    - Initialize state variables (isPlaying, currentTime, duration, isLoading, error)
    - _Requirements: 1.1, 1.2, 8.1_

  - [ ]* 2.2 Write property tests for AudioPlayer rendering
    - **Property 1: AudioPlayer renders when audioUrl exists**
    - **Property 2: Initial state shows play button**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Implement play/pause functionality
    - Add handlePlayPause function to toggle audio playback
    - Integrate with AudioPlayerProvider context to coordinate multiple players
    - Update isPlaying state based on audio element events
    - Handle audio element play() and pause() method calls
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.4 Write property tests for play/pause behavior
    - **Property 4: Play button triggers audio playback**
    - **Property 5: Playing state shows pause button**
    - **Property 6: Pause button stops playback**
    - **Property 7: Play-pause-play preserves position (Round Trip)**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 2.5 Implement audio completion handling
    - Add event listener for audio 'ended' event
    - Reset component to initial state when audio completes
    - Update isPlaying to false and reset currentTime
    - _Requirements: 2.5_

  - [ ]* 2.6 Write property test for audio completion
    - **Property 8: Audio completion resets to initial state**
    - **Validates: Requirements 2.5**

- [ ] 3. Implement progress tracking and time display
  - [x] 3.1 Add progress bar component
    - Create progress bar UI with Tailwind CSS using amber accent color
    - Implement handleTimeUpdate to update currentTime state
    - Add event listener for audio 'timeupdate' event
    - Calculate and display progress percentage (currentTime / duration)
    - _Requirements: 3.1, 3.4_

  - [ ]* 3.2 Write property test for progress updates
    - **Property 9: Progress bar updates during playback**
    - **Validates: Requirements 3.1**

  - [x] 3.3 Implement time formatting utility
    - Create formatTime function to convert seconds to MM:SS format
    - Handle zero-padding for minutes and seconds
    - Display current time and total duration in the UI
    - _Requirements: 3.2, 3.3_

  - [ ]* 3.4 Write property test for time formatting
    - **Property 10: Time formatting produces MM:SS format**
    - **Validates: Requirements 3.2, 3.3**

- [ ] 4. Implement seek functionality
  - [x] 4.1 Add seek interaction handlers
    - Implement handleSeek function to update audio.currentTime
    - Add click handler on progress bar to jump to position
    - Add drag handlers for scrubbing through audio
    - Calculate time position from click/drag coordinates
    - _Requirements: 4.1, 4.2_

  - [ ]* 4.2 Write property tests for seeking
    - **Property 11: Seeking updates playback position**
    - **Property 12: Seeking preserves play/pause state (Invariant)**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 4.3 Add touch support for mobile seeking
    - Add touch event handlers (touchstart, touchmove, touchend)
    - Ensure touch gestures work equivalently to mouse interactions
    - Test on mobile viewport sizes
    - _Requirements: 9.3_

  - [ ]* 4.4 Write property test for touch seeking
    - **Property 21: Touch gestures enable seeking on mobile**
    - **Validates: Requirements 9.3**

- [ ] 5. Checkpoint - Ensure core player functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement loading and error states
  - [x] 6.1 Add loading state handling
    - Display loading indicator when play() is invoked before metadata loads
    - Add event listener for 'loadedmetadata' to populate duration
    - Add event listener for 'canplay' to hide loading indicator
    - Implement 10-second timeout for loading failures
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 6.2 Write property tests for loading states
    - **Property 13: Loading state displays during initialization**
    - **Property 14: Metadata load populates duration**
    - **Validates: Requirements 5.1, 5.2**

  - [x] 6.3 Implement error handling
    - Add event listener for audio 'error' event
    - Detect error types (loading, playback, timeout, auth)
    - Display appropriate error messages based on error type
    - Add retry button for retryable errors
    - Log errors to console with context information
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 6.4 Write property tests for error handling
    - **Property 15: Invalid audioUrl triggers error message**
    - **Property 16: Error state provides retry button**
    - **Validates: Requirements 6.1, 6.4**

  - [ ]* 6.5 Write unit tests for error scenarios
    - Test 404 error handling
    - Test 403 auth error handling
    - Test network timeout after 10 seconds
    - Test retry button functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7. Style AudioPlayer with cinematic design
  - [x] 7.1 Apply Tailwind CSS styling
    - Use amber/gold accent color (#D4A853) for interactive elements
    - Use warm off-white (#F5ECD7) for text
    - Match existing design system with glassmorphism effects
    - Ensure 44px minimum tap targets for mobile
    - Add hover and active states for buttons
    - _Requirements: 1.3, 9.2_

  - [x] 7.2 Implement responsive layout
    - Test layout at 320px minimum width
    - Ensure controls stack appropriately on mobile
    - Verify touch-friendly spacing and sizing
    - Test on desktop and mobile viewports
    - _Requirements: 9.1, 9.4_

- [ ] 8. Integrate AudioPlayer into profile dashboard
  - [x] 8.1 Wrap profile dashboard with AudioPlayerProvider
    - Modify `app/profiles/[id]/page.tsx` to import AudioPlayerProvider
    - Wrap main content with AudioPlayerProvider component
    - Ensure context is available to all chapter cards
    - _Requirements: 7.1, 7.3_

  - [ ]* 8.2 Write property test for provider integration
    - **Property 18: Each player maintains independent state**
    - **Property 19: Unmounting stops all playback**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 8.3 Add AudioPlayer to chapter cards
    - Import AudioPlayer component into profile dashboard page
    - Add conditional rendering: if chapter.audioUrl exists, render AudioPlayer
    - Pass chapterId, audioUrl, and chapterTitle as props
    - If no audioUrl, display "Audio unavailable" message
    - _Requirements: 1.1, 1.4, 10.1, 10.2_

  - [ ]* 8.4 Write property tests for chapter card integration
    - **Property 3: Missing audioUrl shows unavailable message**
    - **Property 20: AudioPlayer uses provided audioUrl prop**
    - **Property 22: Chapter information remains visible**
    - **Validates: Requirements 1.4, 8.1, 10.1**

  - [x] 8.5 Preserve existing chapter card styling
    - Ensure chapter number and title remain visible
    - Maintain hover effects and transitions
    - Integrate AudioPlayer without breaking existing layout
    - Test with empty state (no chapters)
    - _Requirements: 10.2, 10.3_

- [ ] 9. Add accessibility features
  - [ ] 9.1 Implement ARIA labels and roles
    - Add aria-label to play/pause button
    - Add aria-valuemin, aria-valuemax, aria-valuenow to progress bar
    - Add aria-live region for time display updates
    - Add role="slider" to progress bar
    - _Requirements: 1.1, 3.1_

  - [ ] 9.2 Add keyboard navigation support
    - Add Space key handler for play/pause
    - Add Arrow key handlers for seeking (Left: -5s, Right: +5s)
    - Ensure focus indicators are visible
    - Test tab navigation through controls
    - _Requirements: 4.1_

  - [ ]* 9.3 Write unit tests for accessibility
    - Test screen reader announcements
    - Test keyboard navigation
    - Test focus management
    - Verify ARIA attributes are present
    - _Requirements: 1.1, 3.1, 4.1_

- [ ] 10. Checkpoint - Ensure integration is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Verify environment configuration
  - [x] 11.1 Check BLOB_READ_WRITE_TOKEN configuration
    - Verify BLOB_READ_WRITE_TOKEN exists in .env.local
    - Add console warning if token is missing during development
    - Test audio loading with valid token
    - _Requirements: 8.2, 8.3_

  - [x] 11.2 Test with real Vercel Blob URLs
    - Verify audioUrl values from database work correctly
    - Test with existing chapter audio files
    - Confirm CORS headers allow playback
    - _Requirements: 8.1_

- [ ] 12. Final testing and polish
  - [ ]* 12.1 Run all property-based tests
    - Execute all 22 property tests with 100 iterations each
    - Verify all properties pass
    - Fix any failing properties
    - _Requirements: All_

  - [ ]* 12.2 Run all unit tests
    - Execute Jest test suite
    - Verify 80% code coverage for AudioPlayer component
    - Fix any failing tests
    - _Requirements: All_

  - [ ] 12.3 Manual testing checklist
    - Test play/pause on multiple chapters
    - Test seeking with click and drag
    - Test error states with invalid URLs
    - Test on Chrome, Firefox, Safari
    - Test on mobile devices (iOS and Android)
    - Test with screen reader
    - Test keyboard navigation
    - _Requirements: All_

  - [ ] 12.4 Cross-browser compatibility verification
    - Test in Chrome (latest)
    - Test in Firefox (latest)
    - Test in Safari (latest)
    - Test in mobile browsers
    - _Requirements: 9.1, 9.4_

- [ ] 13. Final checkpoint - Feature complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows a bottom-up approach: core components → integration → testing → polish
