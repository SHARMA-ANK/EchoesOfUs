import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMagicLink } from "@/lib/auth/magic-link";
import { requireAuth, requireProfileOwnership } from "@/lib/auth/middleware";

// POST create new chapter (magic link token OR authenticated admin with profileId)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, profileId: bodyProfileId, title, transcript, summary, audioUrl, musicUrl, voiceId } = body;

        // Extract token from body or query param
        const magicLinkToken = token || req.nextUrl.searchParams.get("token");

        let resolvedProfileId: string;

        if (magicLinkToken) {
            // Path 1: Magic link token auth
            const profile = await validateMagicLink(magicLinkToken);
            if (!profile) {
                return NextResponse.json(
                    { error: "Invalid or expired magic link token" },
                    { status: 403 }
                );
            }
            resolvedProfileId = profile.id;
        } else if (bodyProfileId) {
            // Path 2: Session auth fallback (admin creating chapter from dashboard)
            const user = await requireAuth(req);
            if (!user) {
                return NextResponse.json(
                    { error: "Magic link token is required" },
                    { status: 403 }
                );
            }
            const owns = await requireProfileOwnership(bodyProfileId, user.id);
            if (!owns) {
                return NextResponse.json(
                    { error: "Forbidden" },
                    { status: 403 }
                );
            }
            resolvedProfileId = bodyProfileId;
        } else {
            return NextResponse.json(
                { error: "Magic link token is required" },
                { status: 403 }
            );
        }

        if (!title) {
            return NextResponse.json(
                { error: "title is required" },
                { status: 400 }
            );
        }

        // Get the next chapter number for this profile
        const lastChapter = await prisma.chapter.findFirst({
            where: { profileId: resolvedProfileId },
            orderBy: { chapterNumber: "desc" },
        });

        const chapterNumber = (lastChapter?.chapterNumber ?? 0) + 1;

        const chapter = await prisma.chapter.create({
            data: {
                profileId: resolvedProfileId,
                chapterNumber,
                title,
                transcript: transcript || null,
                summary: summary || null,
                audioUrl: audioUrl || null,
                musicUrl: musicUrl || null,
                voiceId: voiceId || null,
            },
        });

        return NextResponse.json(chapter, { status: 201 });
    } catch (error) {
        console.error("Error creating chapter:", error);
        return NextResponse.json(
            { error: "Failed to create chapter" },
            { status: 500 }
        );
    }
}
