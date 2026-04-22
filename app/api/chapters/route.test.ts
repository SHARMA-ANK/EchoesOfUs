import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateMagicLinkToken } from '@/lib/auth/magic-link';

describe('Chapter Management APIs', () => {
    let testUser: { id: string };
    let testFamily: { id: string };
    let testProfile: { id: string; magicLinkToken: string };

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

        // Create test profile with magic link token
        const magicLinkToken = generateMagicLinkToken();
        testProfile = await prisma.profile.create({
            data: {
                familyId: testFamily.id,
                name: 'Test Profile',
                age: 30,
                magicLinkToken,
            },
        });
    });

    describe('POST /api/chapters', () => {
        it('should return 403 without magic link token', async () => {
            const response = await fetch('http://localhost:3000/api/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Test Chapter',
                }),
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 with invalid magic link token', async () => {
            const response = await fetch('http://localhost:3000/api/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: 'invalid_token',
                    title: 'Test Chapter',
                }),
            });
            expect(response.status).toBe(403);
        });

        it('should create chapter with valid magic link token', async () => {
            const response = await fetch('http://localhost:3000/api/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: testProfile.magicLinkToken,
                    title: 'My First Chapter',
                    transcript: 'This is the transcript',
                    summary: 'This is the summary',
                }),
            });

            expect(response.status).toBe(201);
            const chapter = await response.json();
            expect(chapter.title).toBe('My First Chapter');
            expect(chapter.profileId).toBe(testProfile.id);
            expect(chapter.chapterNumber).toBe(1);
        });

        it('should increment chapter number for subsequent chapters', async () => {
            // Create first chapter
            await fetch('http://localhost:3000/api/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: testProfile.magicLinkToken,
                    title: 'Chapter 1',
                }),
            });

            // Create second chapter
            const response = await fetch('http://localhost:3000/api/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: testProfile.magicLinkToken,
                    title: 'Chapter 2',
                }),
            });

            expect(response.status).toBe(201);
            const chapter = await response.json();
            expect(chapter.chapterNumber).toBe(2);
        });
    });
});
