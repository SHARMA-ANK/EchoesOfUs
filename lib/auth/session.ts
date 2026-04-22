import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const SESSION_DURATION_DAYS = 30;

/**
 * Session object returned by createSession
 */
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

/**
 * Generate a secure random token for session identification
 * @returns 64-character hex string (32 bytes)
 */
function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate session expiration date (30 days from now)
 * @returns Date object representing expiration time
 */
function calculateExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
    return expiresAt;
}

/**
 * Create a new session for a user
 * @param userId - The user ID to create a session for
 * @returns Promise resolving to the created Session object
 */
export async function createSession(userId: string): Promise<Session> {
    const token = generateSessionToken();
    const expiresAt = calculateExpirationDate();

    const session = await prisma.session.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });

    return session;
}

/**
 * Validate a session token and return the associated user if valid
 * @param token - The session token to validate
 * @returns Promise resolving to User object if valid, null if invalid or expired
 */
export async function validateSession(token: string): Promise<any | null> {
    if (!token || token.length !== 64) {
        return null;
    }

    const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!session) {
        return null;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
        // Clean up expired session
        await prisma.session.delete({ where: { id: session.id } });
        return null;
    }

    return session.user;
}

/**
 * Renew a session by extending its expiration date (sliding window)
 * @param token - The session token to renew
 * @returns Promise resolving when renewal is complete
 * @throws Error if session not found or expired
 */
export async function renewSession(token: string): Promise<void> {
    if (!token || token.length !== 64) {
        throw new Error('Invalid session token');
    }

    const session = await prisma.session.findUnique({
        where: { token },
    });

    if (!session) {
        throw new Error('Session not found');
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
        // Clean up expired session
        await prisma.session.delete({ where: { id: session.id } });
        throw new Error('Session expired');
    }

    // Extend expiration date
    const newExpiresAt = calculateExpirationDate();
    await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiresAt },
    });
}

/**
 * Destroy a session by deleting it from the database
 * @param token - The session token to destroy
 * @returns Promise resolving when session is destroyed
 */
export async function destroySession(token: string): Promise<void> {
    if (!token || token.length !== 64) {
        return; // Silently ignore invalid tokens
    }

    await prisma.session.deleteMany({
        where: { token },
    });
}
