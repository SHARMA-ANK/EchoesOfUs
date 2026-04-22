import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const audioUrl = req.nextUrl.searchParams.get("url");

        if (!audioUrl) {
            return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
        }

        // Fetch the audio file from Vercel Blob with authentication
        const response = await fetch(audioUrl, {
            headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to fetch audio from Vercel Blob:", response.status);
            return NextResponse.json(
                { error: "Failed to fetch audio" },
                { status: response.status }
            );
        }

        // Get the audio data
        const audioBuffer = await response.arrayBuffer();

        // Use the content-type from Vercel Blob if available, fallback to audio/mpeg
        const contentType = response.headers.get("content-type") || "audio/mpeg";

        // Return the audio with proper headers
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": audioBuffer.byteLength.toString(),
                "Accept-Ranges": "bytes",
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Audio proxy error:", error);
        return NextResponse.json(
            { error: "Failed to proxy audio" },
            { status: 500 }
        );
    }
}
