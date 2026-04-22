# Database Setup - Echoes of Us

## Overview
This project uses **Prisma** with **SQLite** for local development. The database stores user profiles and their recorded chapters.

## Database Schema

### Profile Model
- `id`: Unique identifier (cuid)
- `name`: Person's name
- `age`: Person's age
- `relation`: Optional relation (e.g., "Grandfather")
- `shareSlug`: Unique slug for public sharing
- `chapters`: Related chapters

### Chapter Model
- `id`: Unique identifier (cuid)
- `profileId`: Foreign key to Profile
- `chapterNumber`: Sequential chapter number
- `title`: Chapter title
- `transcript`: Full conversation transcript
- `summary`: LLM-generated summary for agent memory
- `audioUrl`: URL to the generated audio
- `voiceId`: ElevenLabs voice ID

## Setup Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Sync database schema
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

## API Routes

### Profiles
- `GET /api/profiles` - List all profiles
- `POST /api/profiles` - Create new profile
- `GET /api/profiles/[id]` - Get single profile with chapters

### Chapters
- `POST /api/chapters` - Create new chapter

## Pages

### Home Page
- Route: `/`
- Two options: "Create Profile" or "Quick Interview"

### New Profile Form
- Route: `/profiles/new`
- Creates a new profile with name, age, and relation

### Profile Dashboard
- Route: `/profiles/[id]`
- Shows profile details and chapters list
- Empty state when no chapters exist
- "Start New Chapter" button to begin recording

### Interview Room
- Route: `/interview?profileId={id}` (or `/interview` for quick mode)
- Records conversation with ElevenLabs agent
- **Agent Memory**: When profileId is provided, fetches past chapter summaries and injects them into the agent's prompt
- Generates documentary with cloned voice
- Saves chapter to database if profileId is provided

## Agent Memory Implementation

When a user starts a new chapter for an existing profile, the system:

1. Fetches the profile and all past chapter summaries from the database
2. Constructs a context string with past chapter summaries
3. Passes an override prompt to the ElevenLabs agent via the signed URL:
   ```
   You are interviewing {Profile.Name}. In previous chapters, they talked about:
   
   Chapter 1: {summary}
   Chapter 2: {summary}
   ...
   
   Acknowledge where we left off, and smoothly ask them about the next logical phase of their life.
   ```
4. The agent uses this context to provide continuity across interview sessions

## Profile Creation Flow

1. User creates a profile at `/profiles/new`
2. Profile is saved to the database
3. User is redirected to `/profiles/{id}` dashboard
4. User clicks "Start New Chapter" to begin an interview
5. After interview, chapter is saved to the database with:
   - Transcript from ElevenLabs conversation
   - Generated memoir script from Gemini
   - Audio URL (currently blob URL)
   - Voice ID from ElevenLabs voice cloning

## Production Considerations

- Replace blob URLs with cloud storage (S3, Cloudinary, etc.)
- Add authentication and authorization
- Add profile sharing via shareSlug
- Implement chapter playback in profile dashboard
- Add chapter editing and deletion
- Implement agent memory using chapter summaries ✅ (Implemented)

## Testing Agent Memory

To test the agent memory feature:

1. Create a profile at `/profiles/new`
2. Start the first chapter - the agent will conduct a normal interview
3. Complete the interview and let it generate the documentary
4. Return to the profile dashboard
5. Click "Start New Chapter" again
6. The agent should now acknowledge the previous chapter and ask about the next phase

The agent will say something like: "I remember you talked about [previous topics]. Let's continue from there..."
