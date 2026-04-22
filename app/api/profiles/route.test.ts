import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

describe('Profile Management APIs', () => {
    let testUser: { id: string; email: string };
    let testFamily: { id: string };
    let sessionToken: string;

    beforeEach(async () => {
        // Clean up test data
        await prisma.chapter.deleteMany();
        await prisma.profile.deleteMany();
        await prisma.family.deleteMany();
        await prisma.session.deleteMany();
        await prisma.user.deleteMany();

        // Create test user
        const passwordHash = await hashPassword('testpassword123');
        testUser = await prisma.user.create({
            data: {
                email: 'test@example.com',
                passwordHash,
            },
        });

        // Create test family
        testFamily = await prisma.family.create({
            data: {
                adminUserId: testUser.id,
                familyName: 'Test Family',
            },
        });

        // Create session
        const session = await createSession(testUser.id);
        sessionToken = session.token;
    });

    describe('GET /api/profiles', () => {
        it('should return 401 without authentication', async () => {
            const response = await fetch('http://localhost:3000/api/profiles');
            expect(response.status).toBe(401);
        });

        it('should return only profiles owned by the authenticated user', async () => {
            // Create profiles for test user
            await prisma.profile.create({
                data: {
                    familyId: testFamily.id,
                    name: 'Test Profile 1',
                    age: 30,
                    relation: 'Father',
                },
            });

            // Create another user and family
            const otherUser = await prisma.user.create({
                data: {
                    email: 'other@example.com',
                    passwordHash: await hashPassword('password'),
                },
            });
            const otherFamily = await prisma.family.create({
                data: {
                    adminUserId: otherUser.id,
                    familyName: 'Other Family',
                },
            });
            await prisma.profile.create({
                data: {
                    familyId: otherFamily.id,
                    name: 'Other Profile',
                    age: 40,
                },
            });

            const response = await fetch('http://localhost:3000/api/profiles', {
                headers: {
                    Cookie: `session=${sessionToken}`,
                },
            });

            expect(response.status).toBe(200);
            const profiles = await response.json();
            expect(profiles).toHaveLength(1);
            expect(profiles[0].name).toBe('Test Profile 1');
        });
    });

    describe('POST /api/profiles', () => {
        it('should return 401 without authentication', async () => {
            const response = await fetch('http://localhost:3000/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    familyId: testFamily.id,
                    name: 'New Profile',
                    age: 25,
                }),
            });
            expect(response.status).toBe(401);
        });

        it('should create profile with magic link token', async () => {
            const response = await fetch('http://localhost:3000/api/profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: `session=${sessionToken}`,
                },
                body: JSON.stringify({
                    familyId: testFamily.id,
                    name: 'New Profile',
                    age: 25,
                    relation: 'Son',
                }),
            });

            expect(response.status).toBe(201);
            const profile = await response.json();
            expect(profile.name).toBe('New Profile');
            expect(profile.magicLinkToken).toBeDefined();
            expect(profile.magicLinkToken).toHaveLength(64);
        });

        it('should return 403 when trying to create profile in family not owned', async () => {
            // Create another user and family
            const otherUser = await prisma.user.create({
                data: {
                    email: 'other@example.com',
                    passwordHash: await hashPassword('password'),
                },
            });
            const otherFamily = await prisma.family.create({
                data: {
                    adminUserId: otherUser.id,
                    familyName: 'Other Family',
                },
            });

            const response = await fetch('http://localhost:3000/api/profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: `session=${sessionToken}`,
                },
                body: JSON.stringify({
                    familyId: otherFamily.id,
                    name: 'Unauthorized Profile',
                    age: 30,
                }),
            });

            expect(response.status).toBe(403);
        });
    });
});
