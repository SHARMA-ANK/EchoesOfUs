import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, clearSessionCookie } from "@/lib/auth/cookies";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const sessionToken = getSessionToken(request);

        if (sessionToken) {
            // Destroy session in database
            await destroySession(sessionToken);
        }

        // Clear session cookie
        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        clearSessionCookie(response);

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
