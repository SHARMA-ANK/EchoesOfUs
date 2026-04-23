import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { put } from "@vercel/blob";

const elevenlabs = new ElevenLabsClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const conversationId = formData.get("conversationId") as string;

        if (!conversationId) {
            return NextResponse.json(
                { error: "conversationId is required" },
                { status: 400 }
            );
        }

        // Step 1: Fetch conversation transcript from ElevenLabs
        console.log("Fetching transcript for conversation:", conversationId);

        // Retry logic - wait for conversation to be processed
        let conversation: any;
        let retries = 0;
        const maxRetries = 10;
        const retryDelay = 2000; // 2 seconds

        while (retries < maxRetries) {
            conversation = await elevenlabs.conversationalAi.conversations.get(conversationId);

            // Check if conversation is still processing
            if (conversation.status === "processing" || !conversation.transcript || conversation.transcript.length === 0) {
                console.log(`Conversation still processing (attempt ${retries + 1}/${maxRetries}), waiting ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries++;
                continue;
            }

            // Conversation is ready
            break;
        }

        if (retries >= maxRetries) {
            console.error("Conversation processing timeout. Status:", conversation?.status);
            return NextResponse.json(
                { error: "Conversation is still being processed. Please try again in a moment." },
                { status: 503 }
            );
        }

        console.log("Conversation ready after", retries, "retries");

        // Extract transcript from conversation - try multiple approaches
        let transcript = "";

        // Approach 1: From transcript array
        if (Array.isArray(conversation.transcript) && conversation.transcript.length > 0) {
            transcript = conversation.transcript
                .filter((entry: any) => entry.role === "user" || entry.speaker === "user")
                .map((entry: any) => entry.message || entry.text || entry.content || "")
                .join(" ");
        }
        // Approach 2: Direct transcript string
        else if (conversation.transcript && typeof conversation.transcript === "string") {
            transcript = conversation.transcript;
        }
        // Approach 3: From analysis
        else if (conversation.analysis?.transcript) {
            transcript = String(conversation.analysis.transcript);
        }

        // Ensure transcript is a string
        transcript = String(transcript).trim();

        if (!transcript || transcript === "") {
            console.error("Failed to extract transcript. Conversation:", conversation);
            return NextResponse.json(
                { error: "No transcript found for this conversation" },
                { status: 404 }
            );
        }

        console.log("Transcript extracted (length: " + transcript.length + "):", transcript.substring(0, 200) + "...");

        // Step 2: Generate memoir script using Google Gemini
        console.log("Generating memoir script with Gemini...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `You are a world-class documentary scriptwriter in the tradition of Ken Burns and Errol Morris. Your task is to transform the following interview transcript into a cinematic, third-person documentary narration script.

Rules:
- Write in the third person (e.g. "She grew up...", "He remembers the day...", "Their story begins...")
- Use a warm, reverent, and cinematic tone — as if a professional narrator is speaking over beautiful archival footage
- Write 2-3 short paragraphs maximum
- Do NOT use first-person ("I", "my", "me")
- Draw out the emotional core of the story — the details that make this person's life universal and profound

Also generate a music_prompt: a 5-word description of the musical mood that best accompanies this story (e.g. "soft emotional piano chords", "warm nostalgic orchestral strings").

Respond ONLY with a valid JSON object in this exact format, no markdown, no code fences:
{"script": "...", "music_prompt": "..."}

Interview transcript:
${transcript}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const rawText = response.text().trim();

        // Parse structured JSON output — strip markdown code fences if present
        let script: string;
        let musicPrompt: string;
        try {
            const cleaned = rawText
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();
            const parsed = JSON.parse(cleaned);
            script = parsed.script;
            musicPrompt = parsed.music_prompt;
            if (!script || !musicPrompt) throw new Error("Missing keys");
        } catch {
            // Fallback: treat entire response as script if JSON parsing fails
            console.warn("Gemini did not return valid JSON, falling back to raw text");
            script = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
            musicPrompt = "soft emotional cinematic score";
        }

        console.log("Generated script:", script.substring(0, 100) + "...");

        // Step 3: Generate narration (TTS) and background music in parallel
        console.log("Generating narration and music in parallel...");
        const narratorVoiceId = process.env.NEXT_PUBLIC_NARRATOR_VOICE_ID;
        if (!narratorVoiceId) {
            throw new Error("NEXT_PUBLIC_NARRATOR_VOICE_ID is not set");
        }

        const [ttsAudio, musicAudio] = await Promise.all([
            // TTS: narrator voice
            elevenlabs.textToSpeech.convert(narratorVoiceId, {
                text: script,
                modelId: "eleven_multilingual_v2",
            }),
            // Music: generate from mood prompt (~30 seconds)
            elevenlabs.music.compose({
                prompt: musicPrompt,
                musicLengthMs: 30000,
            }),
        ]);

        // Convert TTS stream to Buffer
        const ttsChunks: Uint8Array[] = [];
        for await (const chunk of ttsAudio as any) {
            ttsChunks.push(typeof chunk === "string" ? Buffer.from(chunk, "binary") : chunk);
        }
        const narrationBuffer = Buffer.concat(ttsChunks);

        // Convert music stream to Buffer
        const musicChunks: Uint8Array[] = [];
        for await (const chunk of musicAudio as any) {
            musicChunks.push(typeof chunk === "string" ? Buffer.from(chunk, "binary") : chunk);
        }
        const musicBuffer = Buffer.concat(musicChunks);

        console.log(`Narration buffer size: ${narrationBuffer.length} bytes`);
        console.log(`Music buffer size: ${musicBuffer.length} bytes`);

        // Step 4: Upload both audio files to Vercel Blob in parallel
        console.log("Uploading audio files to Vercel Blob...");
        const timestamp = Date.now();

        const [voiceBlob, musicBlob] = await Promise.all([
            put(`documentaries/voice-${timestamp}.mp3`, narrationBuffer, {
                access: "private",
                contentType: "audio/mpeg",
            }),
            put(`documentaries/music-${timestamp}.mp3`, musicBuffer, {
                access: "private",
                contentType: "audio/mpeg",
            }),
        ]);

        console.log("Voice URL:", voiceBlob.url);
        console.log("Music URL:", musicBlob.url);

        // Return JSON with both URLs
        return NextResponse.json({
            voiceUrl: voiceBlob.url,
            musicUrl: musicBlob.url,
            script,
            transcript,
            musicPrompt,
            voiceId: narratorVoiceId,
        });
    } catch (error) {
        console.error("Documentary generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate documentary", details: String(error) },
            { status: 500 }
        );
    }
}
