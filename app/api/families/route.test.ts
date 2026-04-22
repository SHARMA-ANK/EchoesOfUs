import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';

describe('GET /api/families', () => {
    let testUser: { id: string; email: string };
    let testSession: { token: string };
    let testFamily: { id: string };

    beforeEach(async () => {
        // Create test user
        testUser = await prisma.user.create({
            data: {
                email: `test-families-get-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });

        // Create session
        testSession = await createSession(testUser.id);

        // Create test family
        testFamily = await prisma.family.create({
            data: {
                adminUserId: testUser.id,
                familyName: 'Test Family',
                isPublishedToGlobal: false,
            },
        });
    });

    afterEach(async () => {
        // Cleanup
        await prisma.family.deleteMany({ where: { adminUserId: testUser.id } });
        await prisma.session.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should return 401 when not authenticated', async () => {
        const req = new NextRequest('http://localhost:3000/api/families');
        const response = await GET(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Authentication required');
    });

    it('should return families owned by authenticated user', async () => {
        const req = new NextRequest('http://localhost:3000/api/families', {
            headers: {
                Cookie: `session=${testSession.token}`,
            },
        });

        const response = await GET(req);

        expect(response.status).toBe(200);
        const families = await response.json();
        expect(Array.isArray(families)).toBe(true);
        expect(families.length).toBeGreaterThan(0);
        expect(families[0].id).toBe(testFamily.id);
        expect(families[0].familyName).toBe('Test Family');
    });

    it('should include profiles and chapters in response', async () => {
        // Create a profile with a chapter
        const profile = await prisma.profile.create({
            data: {
                familyId: testFamily.id,
                name: 'Test Profile',
                age: 65,
                relation: 'Grandfather',
            },
        });

        await prisma.chapter.create({
            data: {
                profileId: profile.id,
                chapterNumber: 1,
                title: 'Test Chapter',
            },
        });

        const req = new NextRequest('http://localhost:3000/api/families', {
            headers: {
                Cookie: `session=${testSession.token}`,
            },
        });

        const response = await GET(req);
        const families = await response.json();

        expect(families[0].profiles).toBeDefined();
        expect(families[0].profiles.length).toBe(1);
        expect(families[0].profiles[0].chapters).toBeDefined();
        expect(families[0].profiles[0].chapters.length).toBe(1);
    });
});

describe('POST /api/families', () => {
    let testUser: { id: string; email: string };
    let testSession: { token: string };

    beforeEach(async () => {
        // Create test user
        testUser = await prisma.user.create({
            data: {
                email: `test-families-post-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });

        // Create session
        testSession = await createSession(testUser.id);
    });

    afterEach(async () => {
        // Cleanup
        await prisma.family.deleteMany({ where: { adminUserId: testUser.id } });
        await prisma.session.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should return 401 when not authenticated', async () => {
        const req = new NextRequest('http://localhost:3000/api/families', {
            method: 'POST',
            body: JSON.stringify({ familyName: 'New Family' }),
        });

        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Authentication required');
    });

    it('should create a new family with valid input', async () => {
        const req = new NextRequest('http://localhost:3000/api/families', {
            method: 'POST',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: 'New Family' }),
        });

        const response = await POST(req);

        expect(response.status).toBe(201);
        const family = await response.json();
        expect(family.familyName).toBe('New Family');
        expect(family.adminUserId).toBe(testUser.id);
        expect(family.isPublishedToGlobal).toBe(false);
    });

    it('should return 400 when familyName is missing', async () => {
        const req = new NextRequest('http://localhost:3000/api/families', {
            method: 'POST',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        const response = await POST(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Family name is required');
    });

    it('should return 400 when familyName is empty string', async () => {
        const req = new NextRequest('http://localhost:3000/api/families', {
            method: 'POST',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: '   ' }),
        });

        const response = await POST(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Family name is required');
    });

    it('should set isPublishedToGlobal to false by default', async () => {
        const req = new NextRequest('http://localhost:3000/api/families', {
            method: 'POST',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: 'Default Publish Test' }),
        });

        const response = await POST(req);
        const family = await response.json();

        expect(family.isPublishedToGlobal).toBe(false);
    });
});
