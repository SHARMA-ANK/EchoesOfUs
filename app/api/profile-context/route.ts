import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const profileId = req.nextUrl.searchParams.get("profileId");

    if (!profileId) {
        return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            include: {
                chapters: {
                    orderBy: { chapterNumber: "asc" },
                    select: {
                        chapterNumber: true,
                        summary: true,
                    },
                },
            },
        });

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        console.log(`Fetching context for profile ${profile.name}, found ${profile.chapters.length} chapters`);
        profile.chapters.forEach(ch => {
            console.log(`  Chapter ${ch.chapterNumber}: ${ch.summary?.substring(0, 50)}...`);
        });

        // Build context from past chapter summaries
        if (profile.chapters.length > 0) {
            const pastContext = profile.chapters
                .map((ch) => `Chapter ${ch.chapterNumber}: ${ch.summary}`)
                .join("\n");

            // Create override prompt with agent memory
            const overridePrompt = `You are interviewing ${profile.name}. In previous chapters, they talked about:\n\n${pastContext}\n\nAcknowledge where we left off, and smoothly ask them about the next logical phase of their life.`;

            // Create a contextual first message
            const lastChapter = profile.chapters[profile.chapters.length - 1];
            const firstMessage = `Welcome back! Last time, we talked about ${lastChapter.summary?.substring(0, 100)}... Let's continue your story from there. What happened next?`;

            return NextResponse.json({
                profileName: profile.name,
                hasChapters: true,
                overridePrompt,
                firstMessage,
            });
        }

        return NextResponse.json({
            profileName: profile.name,
            hasChapters: false,
        });
    } catch (error) {
        console.error("Error fetching profile context:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile context" },
            { status: 500 }
        );
    }
}
