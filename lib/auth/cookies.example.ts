/**
 * Example usage of session cookie utilities
 * 
 * This file demonstrates how to use the cookie utilities in API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, clearSessionCookie, getSessionToken } from './cookies';
import { createSession, validateSession, destroySession } from './session';

/**
 * Example: Login API route
 * Sets a session cookie after successful authentication
 */
export async function exampleLoginRoute(req: NextRequest) {
    // ... authenticate user (verify email/password) ...
    const userId = 'user-123'; // From authentication

    // Create session in database
    const session = await createSession(userId);

    // Create response
    const response = NextResponse.json({
        success: true,
        userId
    });

    // Set session cookie
    setSessionCookie(response, session.token);

    return response;
}

/**
 * Example: Logout API route
 * Clears the session cookie and destroys the session
 */
export async function exampleLogoutRoute(req: NextRequest) {
    // Get session token from request
    const token = getSessionToken(req);

    if (token) {
        // Destroy session in database
        await destroySession(token);
    }

    // Create response
    const response = NextResponse.json({
        success: true
    });

    // Clear session cookie
    clearSessionCookie(response);

    return response;
}

/**
 * Example: Protected API route
 * Validates session cookie before allowing access
 */
export async function exampleProtectedRoute(req: NextRequest) {
    // Get session token from request
    const token = getSessionToken(req);

    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Validate session
    const user = await validateSession(token);

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    // User is authenticated, proceed with request
    return NextResponse.json({
        message: 'Protected data',
        user: {
            id: user.id,
            email: user.email
        }
    });
}
