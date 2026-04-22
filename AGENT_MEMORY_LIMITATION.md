# Agent Memory Limitation with React SDK

## Issue

The `@elevenlabs/react` SDK's `useConversation` hook does not properly support conversation config overrides when passed to `startSession()`. While the overrides are being built correctly in the code, they are not being sent to the ElevenLabs WebSocket connection.

## Evidence

- Server logs show all chapters are fetched correctly ✅
- Browser console shows the full override prompt with all chapters ✅  
- The `overrides` object is correctly formatted ✅
- But the agent still uses the default prompt ❌

## Root Cause

The `@elevenlabs/react` SDK abstracts the WebSocket layer and doesn't expose the ability to send the `conversation_initiation_client_data` message that contains overrides.

## Recommended Solution: Use Dynamic Variables

ElevenLabs recommends using **Dynamic Variables** instead of overrides for this use case. This is more maintainable and better supported.

### Implementation Steps:

1. **Update Agent Prompt in Dashboard**:
   Go to your agent settings and modify the system prompt to include:
   ```
   You are interviewing {{user_name}}. 
   
   {{#if previous_chapters}}
   In previous chapters, they talked about:
   {{previous_chapters}}
   
   Acknowledge where we left off, and smoothly ask them about the next logical phase of their life.
   {{else}}
   This is their first interview. Start by asking them about their earliest memories and where they grew up.
   {{/if}}
   ```

2. **Update Code to Pass Dynamic Variables**:
   Instead of overrides, pass dynamic variables:
   ```typescript
   await startSession({ 
       signedUrl: signed_url,
       variables: {
           user_name: profileName,
           previous_chapters: pastChaptersText
       }
   });
   ```

## Alternative Solution: Use Lower-Level SDK

If you need full control, use `@elevenlabs/client` directly instead of the React hook:

```typescript
import { Conversation } from "@elevenlabs/client";

const conversation = await Conversation.startSession({
    agentId: "your-agent-id",
    overrides: {
        agent: {
            prompt: {
                prompt: overridePrompt
            }
        }
    }
});
```

This gives you direct WebSocket access but requires more manual state management.

## Current Status

The code is correctly building the agent memory context with all chapters, but the React SDK limitation prevents it from being applied. To make this work, we need to either:

1. Switch to Dynamic Variables (recommended by ElevenLabs)
2. Replace `useConversation` with the lower-level `Conversation` class
3. Wait for ElevenLabs to add override support to the React SDK
