import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Profile object returned by validateMagicLink
 */
export interface Profile {
    id: string;
    familyId: string;
    name: string;
    age: number;
    relation: string | null;
    shareSlug: string;
    magicLinkToken: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Generate a cryptographically secure magic link token
 * @returns 64-character hex string (32 bytes)
 */
export function generateMagicLinkToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a magic link token and return the associated profile
 * @param token - The magic link token to validate
 * @returns Promise resolving to Profile object if valid, null if invalid
 */
export async function validateMagicLink(token: string): Promise<Profile | null> {
    // Token format validation: must be exactly 64 hex characters
    if (!token || token.length !== 64) {
        return null;
    }

    // Verify token contains only hexadecimal characters
    if (!/^[0-9a-f]{64}$/i.test(token)) {
        return null;
    }

    const profile = await prisma.profile.findUnique({
        where: { magicLinkToken: token },
    });

    return profile;
}
