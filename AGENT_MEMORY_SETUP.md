# Agent Memory Setup Guide

## Prerequisites

Before agent memory will work, you MUST enable overrides in your ElevenLabs agent settings.

## Step 1: Enable Overrides in ElevenLabs Dashboard

1. Go to https://elevenlabs.io/app/conversational-ai
2. Select your agent (the one with ID: `agent_5401kpnc0yqve91bygzfjjr5c2em`)
3. Click on the "Security" tab
4. Enable the following overrides:
   - ✅ System prompt
   - ✅ First message (optional, but recommended)
5. Save the changes

**IMPORTANT**: Without enabling these overrides in the dashboard, the agent will ignore any override attempts from the code.

## Step 2: Verify Implementation

After enabling overrides, test the flow:

1. Create a profile
2. Complete the first chapter interview
3. Return to the profile dashboard
4. Click "Start New Chapter"
5. Check the browser console - you should see:
   ```
   Agent memory enabled: You are interviewing [Name]. In previous chapters, they talked about:...
   ```
6. The agent should acknowledge the previous chapter and ask about the next phase

## Troubleshooting

### Agent still asks the same questions

**Check 1**: Verify overrides are enabled in the ElevenLabs dashboard
- Go to agent settings → Security tab
- Ensure "System prompt" override is enabled

**Check 2**: Check browser console logs
- Open DevTools (F12)
- Look for "Agent memory enabled:" message
- If you don't see this, the profile context isn't being fetched

**Check 3**: Check server logs
- Look for any errors when fetching profile context
- Verify the chapter summaries are being saved correctly

**Check 4**: Verify chapter summaries exist
- Open Prisma Studio: `npx prisma studio`
- Check the Chapter table
- Ensure the `summary` field has content (not null or empty)

### Connection drops immediately

This usually means the override format is incorrect or overrides aren't enabled in the dashboard.

**Solution**: Enable overrides in the ElevenLabs dashboard first.

## How It Works

1. User clicks "Start New Chapter" with a profileId
2. Frontend fetches profile context from `/api/profile-context?profileId={id}`
3. API returns the override prompt with past chapter summaries
4. Frontend passes this as `clientData.conversation_config_override` to `startSession()`
5. ElevenLabs agent receives the override and uses it instead of the default prompt
6. Agent acknowledges previous chapters and continues the conversation

## Testing Without Overrides

If you want to test without enabling overrides, you can use Dynamic Variables instead (but this requires modifying the agent prompt in the dashboard to include variable placeholders).
