import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const profileId = formData.get("profileId") as string;
        const chapterNumber = formData.get("chapterNumber") as string;

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        // Generate a unique filename
        const filename = `chapters/${profileId}/chapter-${chapterNumber}-${Date.now()}.mp3`;

        // Upload to Vercel Blob (using private access as configured in Vercel)
        const blob = await put(filename, audioFile, {
            access: "private",
            contentType: "audio/mpeg",
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error("Audio upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload audio" },
            { status: 500 }
        );
    }
}
