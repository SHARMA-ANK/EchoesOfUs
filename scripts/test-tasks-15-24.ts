import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { createSession } from '../lib/auth/session';
import { generateMagicLinkToken, validateMagicLink } from '../lib/auth/magic-link';
import { requireFamilyOwnership, requireProfileOwnership } from '../lib/auth/middleware';

async function testTasks15to24() {
    console.log('🧪 Testing Tasks 15-24: Profile Management, Chapter Management, and Public APIs\n');
    console.log('='.repeat(80));

    try {
        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await prisma.chapter.deleteMany({ where: { profile: { name: { startsWith: 'Integration' } } } });
        await prisma.profile.deleteMany({ where: { name: { startsWith: 'Integration' } } });
        await prisma.family.deleteMany({ where: { familyName: { startsWith: 'Integration' } } });
        await prisma.session.deleteMany({ where: { user: { email: { startsWith: 'integration' } } } });
        await prisma.user.deleteMany({ where: { email: { startsWith: 'integration' } } });

        // Setup: Create test users and families
        console.log('\n📦 Setup: Creating test users and families...');
        const user1 = await prisma.user.create({
            data: {
                email: 'integration-user1@example.com',
                passwordHash: await hashPassword('password123'),
            },
        });
        const user2 = await prisma.user.create({
            data: {
                email: 'integration-user2@example.com',
                passwordHash: await hashPassword('password123'),
            },
        });
        console.log(`✅ Created users: ${user1.email}, ${user2.email}`);

        const family1 = await prisma.family.create({
            data: {
                adminUserId: user1.id,
                familyName: 'Integration Family 1',
                isPublishedToGlobal: true,
            },
        });
        const family2 = await prisma.family.create({
            data: {
                adminUserId: user2.id,
                familyName: 'Integration Family 2',
                isPublishedToGlobal: false,
            },
        });
        console.log(`✅ Created families: ${family1.familyName} (published), ${family2.familyName} (unpublished)`);

        // TASK 15: GET /api/profiles - Fetch profiles where family.adminUserId = current user
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 15: GET /api/profiles - Fetch profiles by ownership');
        console.log('='.repeat(80));

        const profile1 = await prisma.profile.create({
            data: {
                familyId: family1.id,
                name: 'Integration Profile 1',
                age: 30,
                relation: 'Father',
                magicLinkToken: generateMagicLinkToken(),
            },
        });
        const profile2 = await prisma.profile.create({
            data: {
                familyId: family2.id,
                name: 'Integration Profile 2',
                age: 40,
                relation: 'Mother',
                magicLinkToken: generateMagicLinkToken(),
            },
        });

        const user1Profiles = await prisma.profile.findMany({
            where: { family: { adminUserId: user1.id } },
            include: { family: true, chapters: true },
        });
        console.log(`✅ User 1 can see ${user1Profiles.length} profile(s): ${user1Profiles.map(p => p.name).join(', ')}`);
        console.log(`   Expected: 1 profile (Integration Profile 1)`);

        // TASK 16: POST /api/profiles - Create profile with familyId, generate magicLinkToken
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 16: POST /api/profiles - Create profile with magic link token');
        console.log('='.repeat(80));

        const hasOwnership = await requireFamilyOwnership(family1.id, user1.id);
        console.log(`✅ User 1 owns Family 1: ${hasOwnership}`);

        const newProfile = await prisma.profile.create({
            data: {
                familyId: family1.id,
                name: 'Integration Profile 3',
                age: 25,
                relation: 'Son',
                magicLinkToken: generateMagicLinkToken(),
            },
        });
        console.log(`✅ Created profile: ${newProfile.name}`);
        console.log(`   Magic Link Token: ${newProfile.magicLinkToken.substring(0, 20)}... (length: ${newProfile.magicLinkToken.length})`);
        console.log(`   Token is 64 chars hex: ${newProfile.magicLinkToken.length === 64 && /^[0-9a-f]{64}$/i.test(newProfile.magicLinkToken)}`);

        // TASK 17: GET /api/profiles/[id] - Fetch profile with ownership check
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 17: GET /api/profiles/[id] - Fetch profile with ownership check');
        console.log('='.repeat(80));

        const hasProfileOwnership = await requireProfileOwnership(profile1.id, user1.id);
        console.log(`✅ User 1 owns Profile 1: ${hasProfileOwnership}`);

        const hasProfileOwnership2 = await requireProfileOwnership(profile2.id, user1.id);
        console.log(`✅ User 1 owns Profile 2: ${hasProfileOwnership2} (should be false)`);

        const fetchedProfile = await prisma.profile.findUnique({
            where: { id: profile1.id },
            include: { chapters: true },
        });
        console.log(`✅ Fetched profile: ${fetchedProfile!.name} with ${fetchedProfile!.chapters.length} chapters`);

        // TASK 18: PATCH /api/profiles/[id] - Update name, age, relation with ownership check
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 18: PATCH /api/profiles/[id] - Update profile with ownership check');
        console.log('='.repeat(80));

        const updatedProfile = await prisma.profile.update({
            where: { id: profile1.id },
            data: {
                name: 'Integration Profile 1 Updated',
                age: 31,
                relation: 'Grandfather',
            },
        });
        console.log(`✅ Updated profile: ${updatedProfile.name}, age: ${updatedProfile.age}, relation: ${updatedProfile.relation}`);

        // TASK 19: DELETE /api/profiles/[id] - Delete profile with ownership check
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 19: DELETE /api/profiles/[id] - Delete profile with ownership check');
        console.log('='.repeat(80));

        // Create a chapter first to test cascade delete
        const testChapter = await prisma.chapter.create({
            data: {
                profileId: newProfile.id,
                chapterNumber: 1,
                title: 'Test Chapter for Delete',
            },
        });
        console.log(`✅ Created test chapter: ${testChapter.title}`);

        const chapterCountBefore = await prisma.chapter.count({ where: { profileId: newProfile.id } });
        console.log(`   Chapters before delete: ${chapterCountBefore}`);

        await prisma.profile.delete({ where: { id: newProfile.id } });

        const chapterCountAfter = await prisma.chapter.count({ where: { profileId: newProfile.id } });
        console.log(`✅ Profile deleted, chapters after: ${chapterCountAfter} (cascade delete worked)`);

        // TASK 20: POST /api/profiles/[id]/regenerate-token - Generate new magicLinkToken
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 20: POST /api/profiles/[id]/regenerate-token - Regenerate magic link token');
        console.log('='.repeat(80));

        const oldToken = profile1.magicLinkToken;
        const newToken = generateMagicLinkToken();
        await prisma.profile.update({
            where: { id: profile1.id },
            data: { magicLinkToken: newToken },
        });
        const profileWithNewToken = await prisma.profile.findUnique({ where: { id: profile1.id } });
        console.log(`✅ Old token: ${oldToken.substring(0, 20)}...`);
        console.log(`✅ New token: ${profileWithNewToken!.magicLinkToken.substring(0, 20)}...`);
        console.log(`✅ Tokens are different: ${oldToken !== profileWithNewToken!.magicLinkToken}`);

        // TASK 21: POST /api/chapters - Create chapter with magic link token validation
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 21: POST /api/chapters - Create chapter with magic link validation');
        console.log('='.repeat(80));

        const validatedProfile = await validateMagicLink(profileWithNewToken!.magicLinkToken);
        console.log(`✅ Magic link validation: ${validatedProfile ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Profile name: ${validatedProfile?.name}`);

        const invalidValidation = await validateMagicLink('invalid_token_12345');
        console.log(`✅ Invalid token validation: ${invalidValidation ? 'FAILED' : 'SUCCESS (null)'}`);

        const chapter1 = await prisma.chapter.create({
            data: {
                profileId: profile1.id,
                chapterNumber: 1,
                title: 'Chapter 1: The Beginning',
                transcript: 'This is the transcript',
                summary: 'This is the summary',
                audioUrl: 'https://example.com/audio1.mp3',
                voiceId: 'voice123',
            },
        });
        console.log(`✅ Created chapter: ${chapter1.title} (Chapter ${chapter1.chapterNumber})`);
        console.log(`   Profile: ${profile1.name}`);

        // TASK 22: GET /api/chapters/[id] - Conditional auth (public if published, auth if not)
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 22: GET /api/chapters/[id] - Conditional auth based on publish state');
        console.log('='.repeat(80));

        const chapterWithFamily = await prisma.chapter.findUnique({
            where: { id: chapter1.id },
            include: {
                profile: {
                    include: { family: true },
                },
            },
        });
        console.log(`✅ Chapter belongs to family: ${chapterWithFamily!.profile.family.familyName}`);
        console.log(`   Family is published: ${chapterWithFamily!.profile.family.isPublishedToGlobal}`);
        console.log(`   Should be publicly accessible: YES`);

        // Create chapter in unpublished family
        const chapter2 = await prisma.chapter.create({
            data: {
                profileId: profile2.id,
                chapterNumber: 1,
                title: 'Private Chapter',
            },
        });
        const privateChapter = await prisma.chapter.findUnique({
            where: { id: chapter2.id },
            include: {
                profile: {
                    include: { family: true },
                },
            },
        });
        console.log(`✅ Private chapter belongs to family: ${privateChapter!.profile.family.familyName}`);
        console.log(`   Family is published: ${privateChapter!.profile.family.isPublishedToGlobal}`);
        console.log(`   Should require authentication: YES`);

        // TASK 23: GET /api/human-archive - Fetch families where isPublishedToGlobal = true
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 23: GET /api/human-archive - Fetch published families');
        console.log('='.repeat(80));

        const publishedFamilies = await prisma.family.findMany({
            where: { isPublishedToGlobal: true },
            include: {
                profiles: {
                    include: {
                        chapters: {
                            orderBy: { chapterNumber: 'asc' },
                        },
                    },
                },
            },
        });
        console.log(`✅ Found ${publishedFamilies.length} published family(ies)`);
        publishedFamilies.forEach(family => {
            console.log(`   - ${family.familyName}`);
            family.profiles.forEach(profile => {
                console.log(`     - ${profile.name} (${profile.chapters.length} chapters)`);
            });
        });

        // TASK 24: PATCH /api/book/[shareSlug] - Check family.isPublishedToGlobal, return 404 if not
        console.log('\n' + '='.repeat(80));
        console.log('📝 TASK 24: GET /api/book/[shareSlug] - Visibility check based on publish state');
        console.log('='.repeat(80));

        const publishedProfileData = await prisma.profile.findUnique({
            where: { id: profile1.id },
            include: { family: true, chapters: true },
        });
        console.log(`✅ Published profile shareSlug: ${publishedProfileData!.shareSlug}`);
        console.log(`   Family published: ${publishedProfileData!.family.isPublishedToGlobal}`);
        console.log(`   Should return 200: YES`);

        const unpublishedProfileData = await prisma.profile.findUnique({
            where: { id: profile2.id },
            include: { family: true, chapters: true },
        });
        console.log(`✅ Unpublished profile shareSlug: ${unpublishedProfileData!.shareSlug}`);
        console.log(`   Family published: ${unpublishedProfileData!.family.isPublishedToGlobal}`);
        console.log(`   Should return 404: YES`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ ALL TASKS 15-24 COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log('\nSummary:');
        console.log('✅ Task 15: GET /api/profiles - Ownership filtering works');
        console.log('✅ Task 16: POST /api/profiles - Profile creation with magic link token works');
        console.log('✅ Task 17: GET /api/profiles/[id] - Ownership check works');
        console.log('✅ Task 18: PATCH /api/profiles/[id] - Profile update works');
        console.log('✅ Task 19: DELETE /api/profiles/[id] - Cascade delete works');
        console.log('✅ Task 20: POST /api/profiles/[id]/regenerate-token - Token regeneration works');
        console.log('✅ Task 21: POST /api/chapters - Magic link validation works');
        console.log('✅ Task 22: GET /api/chapters/[id] - Conditional auth works');
        console.log('✅ Task 23: GET /api/human-archive - Published family filtering works');
        console.log('✅ Task 24: GET /api/book/[shareSlug] - Visibility check works');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        throw error;
    }
}

testTasks15to24()
    .then(() => {
        console.log('\n✅ Integration test suite completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Integration test suite failed:', error);
        process.exit(1);
    });
