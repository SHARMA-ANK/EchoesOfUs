# Echoes of Us

> *Your voice. Your legacy. Forever.*

A cinematic legacy-building platform that interviews people via live AI conversation, then transforms their spoken memories into a professional audio documentary — narrated by a professional voice, scored with AI-generated music, and preserved forever in a private Family Archive.

---

## What It Does

Echoes of Us turns a simple conversation into a cinematic audio documentary. A family admin sets up profiles for their loved ones (grandparents, parents, elders), generates a secure magic link, and shares it. The storyteller clicks the link on any device — no login required — and talks to an AI interviewer. When they're done, the app automatically:

1. Transcribes the conversation
2. Writes a cinematic 3rd-person documentary script using Gemini AI
3. Narrates it with a professional ElevenLabs voice
4. Generates a custom ambient music score matched to the emotional mood of the story
5. Saves everything as a chapter under the correct profile

The family admin can then publish their archive to **The Human Archive** — a public, read-only gallery where the world can listen.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React, Tailwind CSS |
| UI Components | Stitch MCP Server |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | Custom session-based auth (bcrypt + HTTP-only cookies) |
| AI Scriptwriting | Google Gemini 2.5 Flash |
| Live Interview | ElevenLabs Conversational AI (WebRTC) |
| Narration | ElevenLabs Text-to-Speech |
| Music | ElevenLabs Music Generation API |
| File Storage | Vercel Blob |
| Deployment | Vercel |

---

## Features

### The Human Archive (Public Home Page)
- A beautiful, read-only gallery of published family stories
- Only shows families where the admin has toggled "Published"
- Visitors can browse profiles and listen to chapters — no account needed
- Links to Login / Sign Up for admins

### Family Admin Dashboard (`/dashboard`)
- Authenticated admin view showing all profiles in your family
- Toggle publish/unpublish your entire family archive with one switch
- Add new profiles (name, age, relation)
- Generate a magic interview link for each profile with one click
- Copy the link and share it — no login required for the storyteller

### Magic Link Interview Room (`/interview?token=...`)
- Accessible to anyone with the link — no account needed
- Validates the token on load; shows "Invalid or Expired Link" if bad
- Live WebRTC conversation with an ElevenLabs AI interviewer
- The AI remembers previous chapter summaries to continue the story naturally
- After the interview ends, the full pipeline runs automatically

### The AI Pipeline (Fully Automated)
When an interview ends, the backend runs in parallel:
- **Gemini AI** generates a structured JSON response with:
  - `script` — cinematic 3rd-person documentary narration
  - `music_prompt` — 5-word mood description for the music
  - `chapter_title` — evocative 2-word chapter name
- **ElevenLabs TTS** narrates the script with a professional narrator voice
- **ElevenLabs Music** generates a 30-second ambient score from the mood prompt
- Both audio files are uploaded to Vercel Blob
- The chapter is saved to the database with title, transcript, summary, voice URL, and music URL

### Chapter Playback
- Each chapter card has a custom audio player
- Clicking Play starts both the narration and the background music simultaneously
- Music plays at 15% volume, loops, and stops when narration ends
- Works on the profile dashboard and the public audiobook page

### Public Audiobook (`/book/[shareSlug]`)
- A beautiful per-profile audiobook view
- Only accessible if the family is published
- Lists all chapters with playback controls

### Profile Dashboard (`/profiles/[id]`)
- Private view for the admin showing all chapters for a specific profile
- Full audio player for each chapter
- "Start New Chapter" button links to the interview with the profile ID

---

## User Flow

### Admin Flow

```
1. Register at /auth/register
   → Enter email, password, and family name (e.g. "The Smith Family")
   → Automatically redirected to /dashboard

2. Dashboard → Add Profile
   → Click "Add Profile" on your family card
   → Fill in name, age, relation (e.g. "Grandpa Joe, 82, Grandfather")

3. Dashboard → Create Interview Link
   → Click "🔗 Create Interview Link" on the profile card
   → A read-only input appears with the magic link URL
   → Copy it and send it to Grandpa Joe via WhatsApp, email, etc.

4. Dashboard → Publish
   → When ready to share with the world, toggle the publish switch
   → Your family archive appears on The Human Archive (home page)
```

### Storyteller Flow (No Login Required)

```
1. Receive the magic link from the family admin
   → Open it on any device (phone, tablet, laptop)

2. Interview Room loads
   → Token is validated automatically
   → If invalid: "Invalid or Expired Link" screen
   → If valid: Interview room loads, showing who the interview is for

3. Press the microphone button
   → Live AI conversation begins
   → The AI asks warm, open-ended questions about their life
   → Speak naturally — the AI listens and responds

4. Press Stop when done
   → "Crafting your story..." processing screen appears
   → The full AI pipeline runs (30–60 seconds)

5. Success page
   → "Your story is saved."
   → The chapter is now visible in the admin's dashboard
```

### Visitor Flow (Public)

```
1. Visit the home page (/)
   → Browse The Human Archive
   → See published family stories

2. Click a profile card
   → Opens the public audiobook at /book/[shareSlug]
   → Listen to all chapters with the audio player
   → Background music plays automatically with narration
```

---

## Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL=postgresql://...

# ElevenLabs
ELEVENLABS_API_KEY=your_key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
NEXT_PUBLIC_NARRATOR_VOICE_ID=your_narrator_voice_id

# Google Gemini
GEMINI_API_KEY=your_key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_token
```

---

## Local Development

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

```bash
# Deploy to Vercel
npx vercel --prod
```

Make sure all environment variables are set in your Vercel project settings. The build command (`prisma migrate deploy && next build`) runs migrations automatically on every deploy.

---

## How Kiro Powered "Echoes of Us"

Building a multi-stage, real-time audio pipeline with secure access controls in a few days required moving beyond traditional AI chat interfaces. Kiro transformed my workflow from chaotic prototyping into disciplined software engineering. Here is how I leveraged Kiro's ecosystem to build Echoes of Us:

### 1. Spec-Driven Development vs. Vibe Coding

**The Structure:** I structured my `.kiro/spec.md` as the ultimate source of truth, divided into strict sections: Tech Stack, Relational Database Schema, Access Control Rules, UI Design System, and the ElevenLabs Pipeline.

**The Impact:** Halfway through the hackathon, I realized a critical security flaw: my profiles were globally scoped, meaning anyone could add a chapter to anyone's story. If I were just "vibe coding," fixing this would have required hours of manually hunting down API routes and refactoring state. Instead, I simply updated my spec to define a new "Family Archive" relational schema and a "Magic Link" token system. Kiro read the updated spec and systematically refactored the database, secured the API routes, and updated the UI.

**The Difference:** Vibe coding creates technical debt; spec-driven development creates scalable, maintainable architecture. The spec kept the AI grounded in the business logic rather than just guessing the next line of code.

### 2. Steering Docs & Micro-Tasking

**The Strategy:** When Kiro tackled complex refactors (like pivoting to the Magic Link architecture), I realized that asking it to update the DB, API, and UI in a single prompt caused hallucinations. I leveraged strict Steering to keep the agent on rails.

**How it improved responses:** I established a "Micro-Tasking" rule in my prompts. For example: *"Step 1: Add magic_link_token to the Prisma schema. Do NOT touch API routes or UI yet. Stop and wait for my confirmation to run the migration."* By steering the agent to isolate its context to one layer of the stack at a time, I achieved a 100% success rate on complex architectural changes without breaking existing, working components.

### 3. MCP (Model Context Protocol) Integration

**Extending Capabilities:** I utilized the Stitch MCP Server to completely offload frontend styling.

**The Workflow Improvement:** Instead of wasting hours wrestling with Tailwind classes to build a premium audio player or a pulsing WebRTC visualizer, I defined my design system ("Cinematic, dark charcoal, warm amber, Apple TV+ documentary vibe") in the spec and commanded Kiro: "Use the Stitch MCP to generate this view." Kiro pulled in beautiful, production-ready UI components instantly. This workflow was a game-changer — it freed up almost all of my hackathon time to focus purely on the complex ElevenLabs backend audio orchestration.

### 4. Kiro Powers

**Bundled Expertise:** I installed the ElevenLabs Kiro Power, and it was the key to making my 3-stage audio pipeline work seamlessly.

**The Benefit:** Because the Power loaded context dynamically based on what I was building, I didn't have to spend hours reading documentation or fixing deprecated SDK calls. Kiro inherently understood the difference between connecting to the v3 Conversational WebSocket for the live interview, calling the Text-to-Speech API for the narrator, and hitting the Music Generation endpoint. It applied ElevenLabs' bundled best practices for audio buffer handling and WebRTC microphone permissions automatically, which would have been incredibly difficult to debug manually.

### 5. Vibe Coding (For Initial Ideation)

**The Structure:** While spec-driven development was used for architecture, I used targeted vibe coding for the initial creative setup. I structured my conversations by defining the "Persona" first.

**Impressive Generation:** The most impressive vibe coding moment was generating the real-time Conversational Agent hook. I asked Kiro to "Wire up the @elevenlabs/react hook to my Stitch mic button, handle browser permissions gracefully, and capture the conversationId on disconnect." Kiro generated a flawless, reactive component that handled all edge cases (denied mic permissions, connection latency) on the first try.

### 6. Agent Hooks

**Automated Workflows:** I utilized Kiro's agent hooks to automate safety checks during rapid iteration.

**The Improvement:** I set up hooks to automatically trigger database pushes (e.g., `npx prisma db push`) and strict type-checking whenever the AI agent modified backend schemas or API routes. This created a tight feedback loop. If the AI generated code that broke a type definition or a database relation, the hook caught it immediately, preventing the agent from compounding errors into the frontend components. This made the development process infinitely safer and faster.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   The Human Archive (/)              │
│              Public read-only gallery                │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
    ┌─────────▼──────────┐  ┌────────▼────────────┐
    │  Admin Dashboard   │  │  Magic Link Room     │
    │  /dashboard        │  │  /interview?token=   │
    │  (auth required)   │  │  (no login needed)   │
    └─────────┬──────────┘  └────────┬────────────┘
              │                       │
    ┌─────────▼──────────┐  ┌────────▼────────────┐
    │  Profile Manager   │  │  ElevenLabs Agent    │
    │  Create profiles   │  │  Live WebRTC convo   │
    │  Generate links    │  └────────┬────────────┘
    │  Toggle publish    │           │
    └────────────────────┘  ┌────────▼────────────┐
                            │  AI Pipeline         │
                            │  Gemini → Script     │
                            │  EL TTS → Voice      │
                            │  EL Music → Score    │
                            │  Vercel Blob → Store │
                            └────────┬────────────┘
                                     │
                            ┌────────▼────────────┐
                            │  Chapter saved to DB │
                            │  Visible in dashboard│
                            └─────────────────────┘
```

---

*Built with ❤️ using Kiro, ElevenLabs, Google Gemini, and Next.js*
