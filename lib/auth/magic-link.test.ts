import { generateMagicLinkToken, validateMagicLink } from './magic-link';
import { hashPassword } from './password';
import { prisma } from '@/lib/prisma';

describe('magic-link', () => {
    let testUserId: string;
    let testFamilyId: string;
    let testProfileId: string;
    let validToken: string;

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

        // Create test family
        const family = await prisma.family.create({
            data: {
                adminUserId: testUserId,
                familyName: 'Test Family',
            },
        });
        testFamilyId = family.id;

        // Generate a valid token
        validToken = generateMagicLinkToken();

        // Create test profile with the token
        const profile = await prisma.profile.create({
            data: {
                familyId: testFamilyId,
                name: 'Test Profile',
                age: 65,
                magicLinkToken: validToken,
            },
        });
        testProfileId = profile.id;
    });

    afterEach(async () => {
        // Clean up test data
        await prisma.profile.deleteMany({ where: { id: testProfileId } });
        await prisma.family.deleteMany({ where: { id: testFamilyId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
    });

    describe('generateMagicLinkToken', () => {
        it('should generate a 64-character hex string', () => {
            const token = generateMagicLinkToken();
            expect(token).toHaveLength(64);
            expect(/^[0-9a-f]{64}$/i.test(token)).toBe(true);
        });

        it('should generate unique tokens', () => {
            const tokens = new Set<string>();
            for (let i = 0; i < 100; i++) {
                tokens.add(generateMagicLinkToken());
            }
            expect(tokens.size).toBe(100);
        });

        it('should only contain hexadecimal characters', () => {
            const token = generateMagicLinkToken();
            expect(/^[0-9a-fA-F]+$/.test(token)).toBe(true);
        });
    });

    describe('validateMagicLink', () => {
        it('should return profile when valid token is provided', async () => {
            const profile = await validateMagicLink(validToken);
            expect(profile).not.toBeNull();
            expect(profile?.id).toBe(testProfileId);
            expect(profile?.name).toBe('Test Profile');
            expect(profile?.age).toBe(65);
        });

        it('should return null when token does not exist', async () => {
            const nonExistentToken = generateMagicLinkToken();
            const profile = await validateMagicLink(nonExistentToken);
            expect(profile).toBeNull();
        });

        it('should return null when token is not 64 characters', async () => {
            const shortToken = 'abc123';
            const profile = await validateMagicLink(shortToken);
            expect(profile).toBeNull();
        });

        it('should return null when token is empty', async () => {
            const profile = await validateMagicLink('');
            expect(profile).toBeNull();
        });

        it('should return null when token contains non-hex characters', async () => {
            const invalidToken = 'g'.repeat(64); // 'g' is not a hex character
            const profile = await validateMagicLink(invalidToken);
            expect(profile).toBeNull();
        });

        it('should return null when token has correct length but wrong format', async () => {
            const invalidToken = 'Z'.repeat(64);
            const profile = await validateMagicLink(invalidToken);
            expect(profile).toBeNull();
        });
    });
});
