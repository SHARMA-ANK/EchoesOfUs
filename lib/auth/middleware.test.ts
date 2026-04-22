import { NextRequest } from 'next/server';
import { requireAuth, requireFamilyOwnership, requireProfileOwnership } from './middleware';
import { createSession } from './session';
import { hashPassword } from './password';
import { prisma } from '@/lib/prisma';

describe('middleware', () => {
    let testUserId: string;
    let testFamilyId: string;
    let testProfileId: string;
    let otherUserId: string;
    let sessionToken: string;

    beforeEach(async () => {
        // Create test user
        const passwordHash = await hashPassword('testpassword123');
        const user = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                passwordHash,
            },
        });
        testUserId = user.id;

        // Create another user for ownership tests
        const otherUser = await prisma.user.create({
            data: {
                email: `other-${Date.now()}@example.com`,
                passwordHash,
            },
        });
        otherUserId = otherUser.id;

        // Create test family
        const family = await prisma.family.create({
            data: {
                adminUserId: testUserId,
                familyName: 'Test Family',
            },
        });
        testFamilyId = family.id;

        // Create test profile
        const profile = await prisma.profile.create({
            data: {
                familyId: testFamilyId,
                name: 'Test Profile',
                age: 65,
            },
        });
        testProfileId = profile.id;

        // Create session
        const session = await createSession(testUserId);
        sessionToken = session.token;
    });

    afterEach(async () => {
        // Clean up test data
        await prisma.session.deleteMany({ where: { userId: testUserId } });
        await prisma.profile.deleteMany({ where: { familyId: testFamilyId } });
        await prisma.family.deleteMany({ where: { id: testFamilyId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
        await prisma.user.deleteMany({ where: { id: otherUserId } });
    });

    describe('requireAuth', () => {
        it('should return user when valid session token is provided', async () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    cookie: `session=${sessionToken}`,
                },
            });

            const user = await requireAuth(request);
            expect(user).not.toBeNull();
            expect(user?.id).toBe(testUserId);
            expect(user?.email).toContain('test-');
        });

        it('should return null when no session cookie is present', async () => {
            const request = new NextRequest('http://localhost:3000/api/test');

            const user = await requireAuth(request);
            expect(user).toBeNull();
        });

        it('should return null when invalid session token is provided', async () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    cookie: 'session=invalid_token_12345',
                },
            });

            const user = await requireAuth(request);
            expect(user).toBeNull();
        });
    });

    describe('requireFamilyOwnership', () => {
        it('should return true when user owns the family', async () => {
            const isOwner = await requireFamilyOwnership(testFamilyId, testUserId);
            expect(isOwner).toBe(true);
        });

        it('should return false when user does not own the family', async () => {
            const isOwner = await requireFamilyOwnership(testFamilyId, otherUserId);
            expect(isOwner).toBe(false);
        });

        it('should return false when family does not exist', async () => {
            const isOwner = await requireFamilyOwnership('nonexistent_id', testUserId);
            expect(isOwner).toBe(false);
        });
    });

    describe('requireProfileOwnership', () => {
        it('should return true when user owns the profile\'s family', async () => {
            const isOwner = await requireProfileOwnership(testProfileId, testUserId);
            expect(isOwner).toBe(true);
        });

        it('should return false when user does not own the profile\'s family', async () => {
            const isOwner = await requireProfileOwnership(testProfileId, otherUserId);
            expect(isOwner).toBe(false);
        });

        it('should return false when profile does not exist', async () => {
            const isOwner = await requireProfileOwnership('nonexistent_id', testUserId);
            expect(isOwner).toBe(false);
        });
    });
});
