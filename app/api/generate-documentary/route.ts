import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const elevenlabs = new ElevenLabsClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const conversationId = formData.get("conversationId") as string;
        const audioBlob = formData.get("audio") as Blob;

        if (!conversationId || !audioBlob) {
            return NextResponse.json(
                { error: "conversationId and audio are required" },
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

        const prompt = `You are a skilled memoir writer. Turn the following interview transcript into a beautiful, nostalgic, first-person narrative. Write 1-2 paragraphs maximum. Use warm, emotional language.

Interview transcript:
${transcript}

Write the memoir narrative:`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const script = response.text();

        console.log("Generated script:", script.substring(0, 100) + "...");

        // Step 3: Clone the user's voice using ElevenLabs Instant Voice Cloning
        console.log("Cloning voice from audio blob...");

        // Use REST API directly for voice cloning
        const formDataVoice = new FormData();
        formDataVoice.append("name", "Echoes User " + Date.now());
        formDataVoice.append("files", audioBlob, "user-voice.webm");
        formDataVoice.append("description", "User's cloned voice for documentary narration");

        const voiceResponse = await fetch("https://api.elevenlabs.io/v1/voices/add", {
            method: "POST",
            headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
            },
            body: formDataVoice,
        });

        if (!voiceResponse.ok) {
            throw new Error(`Voice cloning failed: ${await voiceResponse.text()}`);
        }

        const voiceData = await voiceResponse.json();
        const voiceId = voiceData.voice_id;
        console.log("Voice cloned successfully:", voiceId);

        // Step 4: Generate narration using the cloned voice
        console.log("Generating narration with cloned voice...");
        const audio = await elevenlabs.textToSpeech.convert(voiceId, {
            text: script,
            modelId: "eleven_multilingual_v2",
        });

        // Convert ReadableStream to Buffer
        const reader = audio.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const narrationBuffer = Buffer.concat(chunks);

        // Return the audio as a response
        return new Response(narrationBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "X-Voice-Id": voiceId,
                "X-Script": Buffer.from(script).toString("base64"),
                "X-Transcript": Buffer.from(transcript).toString("base64"),
            },
        });
    } catch (error) {
        console.error("Documentary generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate documentary", details: String(error) },
            { status: 500 }
        );
    }
}
