# Project Name: Echoes of Us
# Goal: A legacy-building app that interviews users via voice, extracts their memories, and creates a cinematic audio documentary of their life narrated in their cloned voice.

## Tech Stack
- Frontend UI: React/Next.js using **Stitch MCP Server** for rapid component generation.
- Styling: Tailwind CSS (via Stitch components).
- Backend: Next.js API Routes.
- Database: Supabase (for storing transcripts and audio metadata).
- AI APIs: ElevenLabs (Voice, Agent, Music), OpenAI (Scriptwriting).

## UI/UX Design System (via Stitch)
- **Vibe:** Emotional, cinematic, nostalgic, and premium (think Apple TV+ documentaries).
- **Colors:** Deep charcoal backgrounds, soft amber/gold accents, warm off-white text.
- **Typography:** Elegant serif fonts for headings, clean sans-serif for body text.

## Core Views to Generate
1. **Landing/Home:** A gentle, welcoming screen with a simple "Begin Your Story" button.
2. **The Interview Room:** A minimalist screen showing an active audio visualizer (pulsing waves) while talking to the ElevenLabs Agent.
3. **The Gallery/Player:** A beautiful audio player card that displays the user's name, the duration of their documentary, and playback controls.

## ElevenLabs Pipeline Requirements
1. **Conversational Agent:** WebRTC connection for the live interview.
2. **Instant Voice Cloning:** Extract audio from the interview to create a Voice ID.
3. **Text-to-Speech:** Narrate the LLM-generated script using the cloned Voice ID.
4. **Music API:** Generate an ambient, nostalgic background track.

## Kiro Instructions
- **Strictly use the Stitch MCP server** to generate the UI components for the 3 Core Views mentioned above. Do not write raw CSS if a Stitch component exists.
- Keep ElevenLabs API logic isolated in a `lib/elevenlabs/` directory.
- Maintain clean state handoffs between the Interview phase and the Processing phase.


## Database Schema (Supabase/PostgreSQL)
We are building a multi-chapter "Audio Book" platform. We need two main tables:
1. **Profiles:** `id`, `name`, `age`, `relation` (e.g., Grandfather), `share_slug` (for public dashboard).
2. **Chapters:** `id`, `profile_id`, `chapter_number`, `title`, `transcript`, `summary` (short LLM summary of the chapter), `audio_url` (cloned voice audio).

## Dynamic Agent Memory
When starting a new Interview for a Profile, the backend must fetch all previous `summary` texts for that person. We will pass these summaries into the ElevenLabs `useConversation` hook using `overrides.agent.prompt.prompt` so the AI knows exactly where the last chapter left off and can seamlessly transition to the next topic.

## Public Dashboard (The Audio Book)
A dynamic Next.js page (`/book/[share_slug]`) that displays the person's Profile and lists all their recorded Chapters as a beautiful, playable audio-book UI using the Stitch MCP.




## Updated Relational Database Schema & Access Control
We are pivoting to a "Family Archive" architecture to ensure privacy and structured legacy building.

1. **Users/Admins:** Authenticated users who manage the account.
2. **Families:** `id`, `admin_user_id`, `family_name`, `is_published_to_global` (boolean).
3. **Profiles (The Storytellers):** `id`, `family_id`, `name`, `age`, `relation`, `magic_link_token`.
4. **Chapters:** `id`, `profile_id`, `chapter_number`, `title`, `transcript`, `summary`, `audio_url`.

## Access Control Rules (CRITICAL)
- **Home Page (The Human Archive):** Only displays Families/Profiles where `is_published_to_global` is TRUE. Visitors can listen, but CANNOT edit or add chapters.
- **Family Dashboard (Private):** Only accessible to the logged-in `admin_user_id`. The Admin can create new Profiles under their Family and toggle the global publish status.
- **The Interviewer Route:** To prevent random people from adding chapters, the Interview page is ONLY accessible via a unique `magic_link_token` generated for a specific Profile.

## User Flow
1. **Admin creates an account** and sets up their "Family" (e.g., "The Smith Family").
2. **Admin adds a Profile** (e.g., "Grandpa Joe, 82").
3. **App generates a Magic Link** for Grandpa Joe.
4. **Grandpa Joe clicks the link** on his iPad, bypassing login, and talks to the ElevenLabs Agent to record a chapter.
5. **Admin reviews the audio** and can click "Publish Family to The Human Archive" so the world can hear Grandpa Joe's story.