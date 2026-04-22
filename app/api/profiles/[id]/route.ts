import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireProfileOwnership } from "@/lib/auth/middleware";

// GET single profile
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Verify profile ownership
        const hasOwnership = await requireProfileOwnership(id, user.id);
        if (!hasOwnership) {
            return NextResponse.json(
                { error: "Forbidden: You do not own this profile" },
                { status: 403 }
            );
        }

        const profile = await prisma.profile.findUnique({
            where: { id },
            include: {
                chapters: {
                    orderBy: {
                        chapterNumber: "asc",
                    },
                },
            },
        });

        if (!profile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// PATCH update profile
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Verify profile ownership
        const hasOwnership = await requireProfileOwnership(id, user.id);
        if (!hasOwnership) {
            return NextResponse.json(
                { error: "Forbidden: You do not own this profile" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { name, age, relation } = body;

        // Build update data object with only provided fields
        const updateData: { name?: string; age?: number; relation?: string | null } = {};
        if (name !== undefined) updateData.name = name;
        if (age !== undefined) updateData.age = parseInt(age);
        if (relation !== undefined) updateData.relation = relation || null;

        const profile = await prisma.profile.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

// DELETE profile
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Verify profile ownership
        const hasOwnership = await requireProfileOwnership(id, user.id);
        if (!hasOwnership) {
            return NextResponse.json(
                { error: "Forbidden: You do not own this profile" },
                { status: 403 }
            );
        }

        // Delete profile (cascade to chapters)
        await prisma.profile.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting profile:", error);
        return NextResponse.json(
            { error: "Failed to delete profile" },
            { status: 500 }
        );
    }
}
