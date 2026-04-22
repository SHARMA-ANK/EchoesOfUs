import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextRequest } from "next/server";

const client = new ElevenLabsClient();

export async function POST(req: NextRequest) {
    const { text } = await req.json();

    const audio = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
        text,
        modelId: "eleven_multilingual_v2",
    });

    // audio is a ReadableStream — pipe it straight to the response
    return new Response(audio as unknown as ReadableStream, {
        headers: { "Content-Type": "audio/mpeg" },
    });
}
