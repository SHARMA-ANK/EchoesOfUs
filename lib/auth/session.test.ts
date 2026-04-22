import { createSession, validateSession, renewSession, destroySession } from './session';
import { prisma } from '@/lib/prisma';

describe('Session Management', () => {
    let testUserId: string;

    beforeEach(async () => {
        // Create a test user
        const user = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                passwordHash: 'test-hash',
            },
        });
        testUserId = user.id;
    });

    afterEach(async () => {
        // Clean up test data
        await prisma.session.deleteMany({
            where: { userId: testUserId },
        });
        await prisma.user.delete({
            where: { id: testUserId },
        });
    });

    describe('createSession', () => {
        it('should create a session with valid token and expiration', async () => {
            const session = await createSession(testUserId);

            expect(session).toBeDefined();
            expect(session.userId).toBe(testUserId);
            expect(session.token).toHaveLength(64); // 32 bytes hex = 64 chars
            expect(session.token).toMatch(/^[0-9a-f]{64}$/); // Hex characters only
            expect(session.expiresAt).toBeInstanceOf(Date);
            expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });

        it('should create session with 30-day expiration', async () => {
            const session = await createSession(testUserId);

            const expectedExpiration = new Date();
            expectedExpiration.setDate(expectedExpiration.getDate() + 30);

            // Allow 1 second tolerance for test execution time
            const timeDiff = Math.abs(session.expiresAt.getTime() - expectedExpiration.getTime());
            expect(timeDiff).toBeLessThan(1000);
        });

        it('should create unique tokens for multiple sessions', async () => {
            const session1 = await createSession(testUserId);
            const session2 = await createSession(testUserId);

            expect(session1.token).not.toBe(session2.token);
        });
    });

    describe('validateSession', () => {
        it('should return user for valid session', async () => {
            const session = await createSession(testUserId);
            const user = await validateSession(session.token);

            expect(user).toBeDefined();
            expect(user?.id).toBe(testUserId);
        });

        it('should return null for invalid token', async () => {
            const user = await validateSession('invalid-token');
            expect(user).toBeNull();
        });

        it('should return null for non-existent token', async () => {
            const fakeToken = '0'.repeat(64);
            const user = await validateSession(fakeToken);
            expect(user).toBeNull();
        });

        it('should return null for expired session', async () => {
            // Create session with past expiration
            const expiredSession = await prisma.session.create({
                data: {
                    userId: testUserId,
                    token: 'a'.repeat(64),
                    expiresAt: new Date(Date.now() - 1000), // 1 second ago
                },
            });

            const user = await validateSession(expiredSession.token);
            expect(user).toBeNull();

            // Verify expired session was deleted
            const deletedSession = await prisma.session.findUnique({
                where: { token: expiredSession.token },
            });
            expect(deletedSession).toBeNull();
        });

        it('should return null for token with wrong length', async () => {
            const user = await validateSession('short');
            expect(user).toBeNull();
        });
    });

    describe('renewSession', () => {
        it('should extend session expiration', async () => {
            const session = await createSession(testUserId);
            const originalExpiration = session.expiresAt;

            // Wait a moment to ensure time difference
            await new Promise(resolve => setTimeout(resolve, 10));

            await renewSession(session.token);

            const renewedSession = await prisma.session.findUnique({
                where: { token: session.token },
            });

            expect(renewedSession).toBeDefined();
            expect(renewedSession!.expiresAt.getTime()).toBeGreaterThan(originalExpiration.getTime());
        });

        it('should throw error for invalid token', async () => {
            await expect(renewSession('invalid')).rejects.toThrow('Invalid session token');
        });

        it('should throw error for non-existent session', async () => {
            const fakeToken = '0'.repeat(64);
            await expect(renewSession(fakeToken)).rejects.toThrow('Session not found');
        });

        it('should throw error for expired session', async () => {
            const expiredSession = await prisma.session.create({
                data: {
                    userId: testUserId,
                    token: 'b'.repeat(64),
                    expiresAt: new Date(Date.now() - 1000),
                },
            });

            await expect(renewSession(expiredSession.token)).rejects.toThrow('Session expired');

            // Verify expired session was deleted
            const deletedSession = await prisma.session.findUnique({
                where: { token: expiredSession.token },
            });
            expect(deletedSession).toBeNull();
        });
    });

    describe('destroySession', () => {
        it('should delete existing session', async () => {
            const session = await createSession(testUserId);

            await destroySession(session.token);

            const deletedSession = await prisma.session.findUnique({
                where: { token: session.token },
            });
            expect(deletedSession).toBeNull();
        });

        it('should not throw error for non-existent session', async () => {
            const fakeToken = '0'.repeat(64);
            await expect(destroySession(fakeToken)).resolves.not.toThrow();
        });

        it('should not throw error for invalid token', async () => {
            await expect(destroySession('invalid')).resolves.not.toThrow();
        });
    });
});
