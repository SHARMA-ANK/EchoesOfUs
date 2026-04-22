import { NextRequest } from 'next/server';
import { getSessionToken } from './cookies';
import { validateSession } from './session';
import { prisma } from '@/lib/prisma';

/**
 * User object returned by requireAuth
 */
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Validate authentication and return the current user
 * @param request - NextRequest object containing session cookie
 * @returns Promise resolving to User object if authenticated, null otherwise
 */
export async function requireAuth(request: NextRequest): Promise<User | null> {
    const token = getSessionToken(request);

    if (!token) {
        return null;
    }

    const user = await validateSession(token);
    return user;
}

/**
 * Check if a user owns a specific family
 * @param familyId - The family ID to check ownership for
 * @param userId - The user ID to verify ownership against
 * @returns Promise resolving to true if user owns family, false otherwise
 */
export async function requireFamilyOwnership(
    familyId: string,
    userId: string
): Promise<boolean> {
    const family = await prisma.family.findUnique({
        where: { id: familyId },
        select: { adminUserId: true },
    });

    if (!family) {
        return false;
    }

    return family.adminUserId === userId;
}

/**
 * Check if a user owns the family associated with a profile
 * @param profileId - The profile ID to check ownership for
 * @param userId - The user ID to verify ownership against
 * @returns Promise resolving to true if user owns profile's family, false otherwise
 */
export async function requireProfileOwnership(
    profileId: string,
    userId: string
): Promise<boolean> {
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: { family: { select: { adminUserId: true } } },
    });

    if (!profile) {
        return false;
    }

    return profile.family.adminUserId === userId;
}
