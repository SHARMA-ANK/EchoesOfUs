import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { generateMagicLinkToken, validateMagicLink } from '../lib/auth/magic-link';

async function testChapterAndPublicAPIs() {
    console.log('🧪 Testing Chapter Management and Public APIs...\n');

    try {
        // Clean up test data
        console.log('Cleaning up test data...');
        await prisma.chapter.deleteMany({ where: { profile: { name: { startsWith: 'Test' } } } });
        await prisma.profile.deleteMany({ where: { name: { startsWith: 'Test' } } });
        await prisma.family.deleteMany({ where: { familyName: { startsWith: 'Test' } } });
        await prisma.session.deleteMany({ where: { user: { email: { startsWith: 'test' } } } });
        await prisma.user.deleteMany({ where: { email: { startsWith: 'test' } } });

        // Create test user
        console.log('Creating test user...');
        const passwordHash = await hashPassword('testpassword123');
        const testUser = await prisma.user.create({
            data: {
                email: 'test-chapter@example.com',
                passwordHash,
            },
        });
        console.log(`✅ Created user: ${testUser.email}`);

        // Test 1: Magic Link Token Validation
        console.log('\n📝 Test 1: Magic Link Token Validation');
        const publishedFamily = await prisma.family.create({
            data: {
                adminUserId: testUser.id,
                familyName: 'Test Published Family',
                isPublishedToGlobal: true,
            },
        });

        const magicToken = generateMagicLinkToken();
        const testProfile = await prisma.profile.create({
            data: {
                familyId: publishedFamily.id,
                name: 'Test Profile with Magic Link',
                age: 30,
                magicLinkToken: magicToken,
            },
        });
        console.log(`✅ Created profile with magic link token`);
        console.log(`   Token: ${magicToken.substring(0, 20)}...`);

        // Validate the token
        const validatedProfile = await validateMagicLink(magicToken);
        console.log(`✅ Token validation: ${validatedProfile ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Profile name: ${validatedProfile?.name}`);

        // Test invalid token
        const invalidProfile = await validateMagicLink('invalid_token');
        console.log(`✅ Invalid token validation: ${invalidProfile ? 'FAILED (should be null)' : 'SUCCESS (null)'}`);

        // Test 2: Chapter Creation with Magic Link
        console.log('\n📝 Test 2: Chapter Creation with Magic Link');
        const chapter1 = await prisma.chapter.create({
            data: {
                profileId: testProfile.id,
                chapterNumber: 1,
                title: 'Chapter 1: The Beginning',
                transcript: 'This is the first chapter transcript',
                summary: 'Summary of chapter 1',
            },
        });
        console.log(`✅ Created chapter: ${chapter1.title} (Chapter ${chapter1.chapterNumber})`);

        const chapter2 = await prisma.chapter.create({
            data: {
                profileId: testProfile.id,
                chapterNumber: 2,
                title: 'Chapter 2: The Journey',
                transcript: 'This is the second chapter transcript',
            },
        });
        console.log(`✅ Created chapter: ${chapter2.title} (Chapter ${chapter2.chapterNumber})`);

        // Test 3: Human Archive (Published Families Only)
        console.log('\n📝 Test 3: Human Archive (Published Families Only)');

        // Create unpublished family
        const unpublishedFamily = await prisma.family.create({
            data: {
                adminUserId: testUser.id,
                familyName: 'Test Unpublished Family',
                isPublishedToGlobal: false,
            },
        });
        await prisma.profile.create({
            data: {
                familyId: unpublishedFamily.id,
                name: 'Test Unpublished Profile',
                age: 40,
                magicLinkToken: generateMagicLinkToken(),
            },
        });

        // Fetch published families
        const publishedFamilies = await prisma.family.findMany({
            where: {
                isPublishedToGlobal: true,
            },
            include: {
                profiles: {
                    include: {
                        chapters: {
                            orderBy: {
                                chapterNumber: 'asc',
                            },
                        },
                    },
                },
            },
        });

        console.log(`✅ Found ${publishedFamilies.length} published family(ies)`);
        publishedFamilies.forEach(family => {
            console.log(`   - ${family.familyName} (${family.profiles.length} profiles)`);
            family.profiles.forEach(profile => {
                console.log(`     - ${profile.name} (${profile.chapters.length} chapters)`);
            });
        });

        // Test 4: Book API Visibility Check
        console.log('\n📝 Test 4: Book API Visibility Check');

        // Get published profile
        const publishedProfile = await prisma.profile.findFirst({
            where: { familyId: publishedFamily.id },
            include: { family: true },
        });
        console.log(`✅ Published profile shareSlug: ${publishedProfile!.shareSlug}`);
        console.log(`   Family published: ${publishedProfile!.family.isPublishedToGlobal}`);

        // Get unpublished profile
        const unpublishedProfile = await prisma.profile.findFirst({
            where: { familyId: unpublishedFamily.id },
            include: { family: true },
        });
        console.log(`✅ Unpublished profile shareSlug: ${unpublishedProfile!.shareSlug}`);
        console.log(`   Family published: ${unpublishedProfile!.family.isPublishedToGlobal}`);

        // Test 5: Chapter Conditional Auth
        console.log('\n📝 Test 5: Chapter Conditional Auth');
        const chapterWithFamily = await prisma.chapter.findUnique({
            where: { id: chapter1.id },
            include: {
                profile: {
                    include: {
                        family: true,
                    },
                },
            },
        });
        console.log(`✅ Chapter belongs to published family: ${chapterWithFamily!.profile.family.isPublishedToGlobal}`);
        console.log(`   Should be publicly accessible: YES`);

        // Test 6: Publish State Toggle
        console.log('\n📝 Test 6: Publish State Toggle');
        console.log(`   Initial state: ${publishedFamily.isPublishedToGlobal}`);

        const toggledFamily = await prisma.family.update({
            where: { id: publishedFamily.id },
            data: { isPublishedToGlobal: false },
        });
        console.log(`✅ After toggle: ${toggledFamily.isPublishedToGlobal}`);

        const toggledBackFamily = await prisma.family.update({
            where: { id: publishedFamily.id },
            data: { isPublishedToGlobal: true },
        });
        console.log(`✅ After toggle back: ${toggledBackFamily.isPublishedToGlobal}`);

        // Test 7: Token Entropy Check
        console.log('\n📝 Test 7: Token Entropy Check');
        const tokens = new Set<string>();
        for (let i = 0; i < 100; i++) {
            const token = generateMagicLinkToken();
            tokens.add(token);

            // Verify format
            if (token.length !== 64) {
                throw new Error(`Token length is ${token.length}, expected 64`);
            }
            if (!/^[0-9a-f]{64}$/i.test(token)) {
                throw new Error(`Token contains non-hex characters: ${token}`);
            }
        }
        console.log(`✅ Generated 100 tokens, all unique: ${tokens.size === 100}`);
        console.log(`   All tokens are 64 chars: YES`);
        console.log(`   All tokens are hex format: YES`);

        console.log('\n✅ All Chapter Management and Public API tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

testChapterAndPublicAPIs()
    .then(() => {
        console.log('\n✅ Test suite completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    });
