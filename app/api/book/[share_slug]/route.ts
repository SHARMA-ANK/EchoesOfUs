import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ share_slug: string }> }
) {
    try {
        const { share_slug: shareSlug } = await params;

        const profile = await prisma.profile.findUnique({
            where: { shareSlug },
            include: {
                family: true,
                chapters: {
                    orderBy: { chapterNumber: "asc" },
                    select: {
                        id: true,
                        chapterNumber: true,
                        title: true,
                        summary: true,
                        audioUrl: true,
                    },
                },
            },
        });

        // Return 404 if profile doesn't exist
        if (!profile) {
            return NextResponse.json(
                { error: "Audiobook not found" },
                { status: 404 }
            );
        }

        // Check if family is published to global
        if (!profile.family.isPublishedToGlobal) {
            return NextResponse.json(
                { error: "Audiobook not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error fetching audiobook:", error);
        return NextResponse.json(
            { error: "Failed to fetch audiobook" },
            { status: 500 }
        );
    }
}
