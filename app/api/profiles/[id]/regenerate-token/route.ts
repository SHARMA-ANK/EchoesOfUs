import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireProfileOwnership } from "@/lib/auth/middleware";
import { generateMagicLinkToken } from "@/lib/auth/magic-link";

// POST regenerate magic link token
export async function POST(
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

        // Check if profile exists
        const profile = await prisma.profile.findUnique({
            where: { id },
        });

        if (!profile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        // Generate new magic link token
        const magicLinkToken = generateMagicLinkToken();

        // Update profile with new token
        await prisma.profile.update({
            where: { id },
            data: { magicLinkToken },
        });

        return NextResponse.json({ magicLinkToken });
    } catch (error) {
        console.error("Error regenerating token:", error);
        return NextResponse.json(
            { error: "Failed to regenerate token" },
            { status: 500 }
        );
    }
}
