import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/cookies";
import { validateSession, renewSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    try {
        const sessionToken = getSessionToken(request);

        if (!sessionToken) {
            return NextResponse.json(null, { status: 200 });
        }

        // validateSession returns the User object or null
        const user = await validateSession(sessionToken);

        if (!user) {
            return NextResponse.json(null, { status: 200 });
        }

        // Renew session (sliding window) - ignore errors
        try { await renewSession(sessionToken); } catch { }

        return NextResponse.json(
            { userId: user.id, email: user.email },
            { status: 200 }
        );
    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json(null, { status: 200 });
    }
}
