import { NextRequest, NextResponse } from "next/server";
import { validateMagicLink } from "@/lib/auth/magic-link";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json({ valid: false }, { status: 400 });
    }

    const profile = await validateMagicLink(token);

    if (!profile) {
        return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({
        valid: true,
        profileId: profile.id,
        profileName: profile.name,
    });
}
