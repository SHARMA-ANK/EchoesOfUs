import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PATCH, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';

describe('PATCH /api/families/[id]', () => {
    let testUser: { id: string; email: string };
    let otherUser: { id: string; email: string };
    let testSession: { token: string };
    let otherSession: { token: string };
    let testFamily: { id: string };

    beforeEach(async () => {
        // Create test users
        testUser = await prisma.user.create({
            data: {
                email: `test-families-patch-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });

        otherUser = await prisma.user.create({
            data: {
                email: `other-families-patch-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });

        // Create sessions
        testSession = await createSession(testUser.id);
        otherSession = await createSession(otherUser.id);

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
        await prisma.family.deleteMany({ where: { adminUserId: otherUser.id } });
        await prisma.session.deleteMany({ where: { userId: testUser.id } });
        await prisma.session.deleteMany({ where: { userId: otherUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 401 when not authenticated', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ familyName: 'Updated Name' }),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Authentication required');
    });

    it('should return 403 when user does not own family', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                Cookie: `session=${otherSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: 'Updated Name' }),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toContain('Forbidden');
    });

    it('should return 404 when family does not exist', async () => {
        const req = new NextRequest('http://localhost:3000/api/families/nonexistent', {
            method: 'PATCH',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: 'Updated Name' }),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.error).toBe('Family not found');
    });

    it('should update familyName when owner makes request', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: 'Updated Family Name' }),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(200);
        const family = await response.json();
        expect(family.familyName).toBe('Updated Family Name');
    });

    it('should update isPublishedToGlobal when owner makes request', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isPublishedToGlobal: true }),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(200);
        const family = await response.json();
        expect(family.isPublishedToGlobal).toBe(true);
    });

    it('should update both fields simultaneously', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                familyName: 'New Name',
                isPublishedToGlobal: true,
            }),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(200);
        const family = await response.json();
        expect(family.familyName).toBe('New Name');
        expect(family.isPublishedToGlobal).toBe(true);
    });

    it('should return 400 when no valid fields provided', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('No valid fields to update');
    });

    it('should return 400 when familyName is empty string', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                Cookie: `session=${testSession.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: '   ' }),
        });

        const response = await PATCH(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Family name');
    });
});

describe('DELETE /api/families/[id]', () => {
    let testUser: { id: string; email: string };
    let otherUser: { id: string; email: string };
    let testSession: { token: string };
    let otherSession: { token: string };
    let testFamily: { id: string };

    beforeEach(async () => {
        // Create test users
        testUser = await prisma.user.create({
            data: {
                email: `test-families-delete-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });

        otherUser = await prisma.user.create({
            data: {
                email: `other-families-delete-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });

        // Create sessions
        testSession = await createSession(testUser.id);
        otherSession = await createSession(otherUser.id);

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
        await prisma.family.deleteMany({ where: { adminUserId: otherUser.id } });
        await prisma.session.deleteMany({ where: { userId: testUser.id } });
        await prisma.session.deleteMany({ where: { userId: otherUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 401 when not authenticated', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'DELETE',
        });

        const response = await DELETE(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Authentication required');
    });

    it('should return 403 when user does not own family', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'DELETE',
            headers: {
                Cookie: `session=${otherSession.token}`,
            },
        });

        const response = await DELETE(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toContain('Forbidden');
    });

    it('should return 404 when family does not exist', async () => {
        const req = new NextRequest('http://localhost:3000/api/families/nonexistent', {
            method: 'DELETE',
            headers: {
                Cookie: `session=${testSession.token}`,
            },
        });

        const response = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) });

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.error).toBe('Family not found');
    });

    it('should delete family when owner makes request', async () => {
        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'DELETE',
            headers: {
                Cookie: `session=${testSession.token}`,
            },
        });

        const response = await DELETE(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);

        // Verify family is deleted
        const deletedFamily = await prisma.family.findUnique({
            where: { id: testFamily.id },
        });
        expect(deletedFamily).toBeNull();
    });

    it('should cascade delete profiles and chapters', async () => {
        // Create profile and chapter
        const profile = await prisma.profile.create({
            data: {
                familyId: testFamily.id,
                name: 'Test Profile',
                age: 65,
            },
        });

        const chapter = await prisma.chapter.create({
            data: {
                profileId: profile.id,
                chapterNumber: 1,
                title: 'Test Chapter',
            },
        });

        const req = new NextRequest(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'DELETE',
            headers: {
                Cookie: `session=${testSession.token}`,
            },
        });

        const response = await DELETE(req, { params: Promise.resolve({ id: testFamily.id }) });

        expect(response.status).toBe(200);

        // Verify cascade deletion
        const deletedProfile = await prisma.profile.findUnique({
            where: { id: profile.id },
        });
        expect(deletedProfile).toBeNull();

        const deletedChapter = await prisma.chapter.findUnique({
            where: { id: chapter.id },
        });
        expect(deletedChapter).toBeNull();
    });
});
