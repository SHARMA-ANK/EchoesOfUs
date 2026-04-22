import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Cookie options for session cookies
 * - httpOnly: Prevents client-side JavaScript access (XSS protection)
 * - secure: Only send over HTTPS in production
 * - sameSite: 'lax' prevents CSRF while allowing normal navigation
 * - path: '/' makes cookie available across entire site
 */
function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: COOKIE_MAX_AGE,
    };
}

/**
 * Set session cookie in NextResponse
 * @param response - NextResponse object to set cookie on
 * @param token - Session token to store in cookie
 */
export function setSessionCookie(response: NextResponse, token: string): void {
    const options = getCookieOptions();

    response.cookies.set(COOKIE_NAME, token, options);
}

/**
 * Clear session cookie in NextResponse
 * @param response - NextResponse object to clear cookie from
 */
export function clearSessionCookie(response: NextResponse): void {
    response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 0, // Expire immediately
    });
}

/**
 * Extract session token from request cookies
 * @param request - NextRequest object to extract cookie from
 * @returns Session token if present, null otherwise
 */
export function getSessionToken(request: NextRequest): string | null {
    const cookie = request.cookies.get(COOKIE_NAME);
    return cookie?.value || null;
}

/**
 * Get session token from server-side cookies() function
 * Used in Server Components and Server Actions
 * @returns Session token if present, null otherwise
 */
export async function getSessionTokenFromCookies(): Promise<string | null> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    return cookie?.value || null;
}
