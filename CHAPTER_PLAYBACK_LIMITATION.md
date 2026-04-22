# Chapter Playback Limitation

## Current Issue

Chapters are being saved to the database with blob URLs (`blob:http://localhost:3000/...`), which are temporary and only exist in the current browser session. Once you refresh the page or close the browser, these URLs become invalid and the audio cannot be played back.

## Why This Happens

When the documentary is generated:
1. Audio is received as an ArrayBuffer from the API
2. A blob URL is created using `URL.createObjectURL()`
3. This blob URL is saved to the database as `audioUrl`
4. Blob URLs are temporary and tied to the browser session

## Solutions

### Option 1: Cloud Storage (Recommended for Production)

Upload the generated audio to cloud storage and save the permanent URL:

**Services to use:**
- AWS S3
- Cloudinary
- Vercel Blob Storage
- Supabase Storage

**Implementation:**
```typescript
// After generating audio
const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });

// Upload to cloud storage
const uploadResponse = await fetch("/api/upload-audio", {
    method: "POST",
    body: audioBlob,
});
const { url } = await uploadResponse.json();

// Save permanent URL to database
await fetch("/api/chapters", {
    method: "POST",
    body: JSON.stringify({
        ...chapterData,
        audioUrl: url, // Permanent cloud URL
    }),
});
```

### Option 2: Base64 in Database (Quick Fix, Not Recommended)

Store the audio as base64 directly in the database:

**Pros:**
- Works immediately
- No external dependencies

**Cons:**
- Large database size
- Slow queries
- Not scalable

**Implementation:**
```typescript
// Convert audio to base64
const base64Audio = Buffer.from(audioBuffer).toString("base64");

// Save to database
await fetch("/api/chapters", {
    method: "POST",
    body: JSON.stringify({
        ...chapterData,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
    }),
});
```

### Option 3: File System Storage (Development Only)

Save audio files to the `public` folder:

**Pros:**
- Simple for local development
- No external services needed

**Cons:**
- Doesn't work in production (Vercel, Netlify, etc.)
- Files lost on deployment

## Current Workaround

For now, you can only listen to chapters in the same browser session where they were created. To test playback:

1. Complete an interview
2. Don't refresh the page
3. The audio will be available in that session only

## Recommended Next Steps

1. Set up Vercel Blob Storage or Cloudinary
2. Create an `/api/upload-audio` endpoint
3. Update the interview page to upload audio after generation
4. Save the permanent URL to the database
5. Add playback controls to the profile dashboard

Would you like me to implement cloud storage integration?
