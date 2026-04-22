import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

describe('Public APIs', () => {
    let testUser: { id: string };
    let publishedFamily: { id: string };
    let unpublishedFamily: { id: string };

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

        // Create published family
        publishedFamily = await prisma.family.create({
            data: {
                adminUserId: testUser.id,
                familyName: 'Published Family',
                isPublishedToGlobal: true,
            },
        });

        // Create unpublished family
        unpublishedFamily = await prisma.family.create({
            data: {
                adminUserId: testUser.id,
                familyName: 'Unpublished Family',
                isPublishedToGlobal: false,
            },
        });

        // Create profiles for both families
        await prisma.profile.create({
            data: {
                familyId: publishedFamily.id,
                name: 'Published Profile',
                age: 30,
            },
        });

        await prisma.profile.create({
            data: {
                familyId: unpublishedFamily.id,
                name: 'Unpublished Profile',
                age: 40,
            },
        });
    });

    describe('GET /api/human-archive', () => {
        it('should return only published families', async () => {
            const response = await fetch('http://localhost:3000/api/human-archive');
            expect(response.status).toBe(200);

            const families = await response.json();
            expect(families).toHaveLength(1);
            expect(families[0].familyName).toBe('Published Family');
            expect(families[0].isPublishedToGlobal).toBe(true);
        });

        it('should include profiles and chapters in response', async () => {
            const response = await fetch('http://localhost:3000/api/human-archive');
            const families = await response.json();

            expect(families[0].profiles).toBeDefined();
            expect(families[0].profiles).toHaveLength(1);
            expect(families[0].profiles[0].name).toBe('Published Profile');
        });
    });

    describe('GET /api/book/[share_slug]', () => {
        it('should return 404 for unpublished family profile', async () => {
            const profile = await prisma.profile.findFirst({
                where: { familyId: unpublishedFamily.id },
            });

            const response = await fetch(
                `http://localhost:3000/api/book/${profile!.shareSlug}`
            );
            expect(response.status).toBe(404);
        });

        it('should return profile for published family', async () => {
            const profile = await prisma.profile.findFirst({
                where: { familyId: publishedFamily.id },
            });

            const response = await fetch(
                `http://localhost:3000/api/book/${profile!.shareSlug}`
            );
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.name).toBe('Published Profile');
            expect(data.family.isPublishedToGlobal).toBe(true);
        });

        it('should return 404 for non-existent share slug', async () => {
            const response = await fetch(
                'http://localhost:3000/api/book/nonexistent'
            );
            expect(response.status).toBe(404);
        });
    });
});
