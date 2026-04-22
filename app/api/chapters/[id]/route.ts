import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/middleware";

// GET single chapter (conditional auth: public if published, auth if not)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch chapter with profile and family
        const chapter = await prisma.chapter.findUnique({
            where: { id },
            include: {
                profile: {
                    include: {
                        family: true,
                    },
                },
            },
        });

        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        // Check if family is published to global (public access)
        if (chapter.profile.family.isPublishedToGlobal) {
            return NextResponse.json(chapter);
        }

        // If not published, require authentication and verify ownership
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify user owns the family
        if (chapter.profile.family.adminUserId !== user.id) {
            return NextResponse.json(
                { error: "Forbidden: You do not own this chapter" },
                { status: 403 }
            );
        }

        return NextResponse.json(chapter);
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json(
            { error: "Failed to fetch chapter" },
            { status: 500 }
        );
    }
}
