import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const agentId = req.nextUrl.searchParams.get("agentId");

    if (!agentId) {
        return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    // Use GET request for signed URL (no overrides here)
    const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
        {
            headers: { "xi-api-key": apiKey },
        }
    );

    if (!response.ok) {
        const text = await response.text();
        console.error("ElevenLabs signed URL error:", text);
        return NextResponse.json({ error: "Failed to get signed URL" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
}
