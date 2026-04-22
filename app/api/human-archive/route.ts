import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all published families (public access)
export async function GET() {
    try {
        // Fetch families where isPublishedToGlobal = true
        const families = await prisma.family.findMany({
            where: {
                isPublishedToGlobal: true,
            },
            include: {
                profiles: {
                    include: {
                        chapters: {
                            orderBy: {
                                chapterNumber: "asc",
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(families);
    } catch (error) {
        console.error("Error fetching human archive:", error);
        return NextResponse.json(
            { error: "Failed to fetch human archive" },
            { status: 500 }
        );
    }
}
