import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireProfileOwnership } from "@/lib/auth/middleware";
import { generateMagicLinkToken } from "@/lib/auth/magic-link";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { id } = await params;

        const owns = await requireProfileOwnership(id, user.id);
        if (!owns) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const token = generateMagicLinkToken(); // 64-char hex, matches validateMagicLink

        await prisma.profile.update({
            where: { id },
            data: { magicLinkToken: token },
        });

        const baseUrl = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
        const magicLink = `${baseUrl}/interview?token=${token}`;

        return NextResponse.json({ magicLink }, { status: 200 });
    } catch (error) {
        console.error("Generate link error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
