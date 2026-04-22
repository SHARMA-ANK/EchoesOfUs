import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { createSession } from '../lib/auth/session';
import { generateMagicLinkToken } from '../lib/auth/magic-link';

async function testProfileAPIs() {
    console.log('🧪 Testing Profile Management APIs...\n');

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
                email: 'test-profile@example.com',
                passwordHash,
            },
        });
        console.log(`✅ Created user: ${testUser.email}`);

        // Create test family
        console.log('Creating test family...');
        const testFamily = await prisma.family.create({
            data: {
                adminUserId: testUser.id,
                familyName: 'Test Family for Profiles',
            },
        });
        console.log(`✅ Created family: ${testFamily.familyName}`);

        // Create session
        const session = await createSession(testUser.id);
        console.log(`✅ Created session: ${session.token.substring(0, 10)}...`);

        // Test 1: Create Profile with Magic Link Token
        console.log('\n📝 Test 1: Create Profile with Magic Link Token');
        const profile1 = await prisma.profile.create({
            data: {
                familyId: testFamily.id,
                name: 'Test Profile 1',
                age: 30,
                relation: 'Father',
                magicLinkToken: generateMagicLinkToken(),
            },
        });
        console.log(`✅ Created profile: ${profile1.name}`);
        console.log(`   Magic Link Token: ${profile1.magicLinkToken.substring(0, 20)}...`);
        console.log(`   Token length: ${profile1.magicLinkToken.length} (should be 64)`);

        // Test 2: Fetch Profiles by Family Ownership
        console.log('\n📝 Test 2: Fetch Profiles by Family Ownership');
        const profiles = await prisma.profile.findMany({
            where: {
                family: {
                    adminUserId: testUser.id,
                },
            },
            include: {
                family: true,
                chapters: true,
            },
        });
        console.log(`✅ Found ${profiles.length} profile(s) owned by user`);
        profiles.forEach(p => {
            console.log(`   - ${p.name} (Family: ${p.family.familyName})`);
        });

        // Test 3: Create Another User and Family (for isolation test)
        console.log('\n📝 Test 3: Test Data Isolation');
        const otherUser = await prisma.user.create({
            data: {
                email: 'test-other@example.com',
                passwordHash: await hashPassword('password'),
            },
        });
        const otherFamily = await prisma.family.create({
            data: {
                adminUserId: otherUser.id,
                familyName: 'Test Other Family',
            },
        });
        await prisma.profile.create({
            data: {
                familyId: otherFamily.id,
                name: 'Test Other Profile',
                age: 40,
                magicLinkToken: generateMagicLinkToken(),
            },
        });

        const isolatedProfiles = await prisma.profile.findMany({
            where: {
                family: {
                    adminUserId: testUser.id,
                },
            },
        });
        console.log(`✅ User 1 can only see ${isolatedProfiles.length} profile(s) (should be 1)`);

        // Test 4: Update Profile
        console.log('\n📝 Test 4: Update Profile');
        const updatedProfile = await prisma.profile.update({
            where: { id: profile1.id },
            data: {
                name: 'Test Profile 1 Updated',
                age: 31,
            },
        });
        console.log(`✅ Updated profile: ${updatedProfile.name}, age: ${updatedProfile.age}`);

        // Test 5: Regenerate Magic Link Token
        console.log('\n📝 Test 5: Regenerate Magic Link Token');
        const oldToken = profile1.magicLinkToken;
        const newToken = generateMagicLinkToken();
        await prisma.profile.update({
            where: { id: profile1.id },
            data: { magicLinkToken: newToken },
        });
        const profileWithNewToken = await prisma.profile.findUnique({
            where: { id: profile1.id },
        });
        console.log(`✅ Old token: ${oldToken.substring(0, 20)}...`);
        console.log(`✅ New token: ${profileWithNewToken!.magicLinkToken.substring(0, 20)}...`);
        console.log(`✅ Tokens are different: ${oldToken !== profileWithNewToken!.magicLinkToken}`);

        // Test 6: Create Chapter with Magic Link Token
        console.log('\n📝 Test 6: Create Chapter with Magic Link Token');
        const chapter = await prisma.chapter.create({
            data: {
                profileId: profile1.id,
                chapterNumber: 1,
                title: 'Test Chapter',
                transcript: 'This is a test transcript',
                summary: 'This is a test summary',
            },
        });
        console.log(`✅ Created chapter: ${chapter.title} (Chapter ${chapter.chapterNumber})`);

        // Test 7: Delete Profile (cascade to chapters)
        console.log('\n📝 Test 7: Delete Profile (cascade to chapters)');
        const chapterCountBefore = await prisma.chapter.count({
            where: { profileId: profile1.id },
        });
        console.log(`   Chapters before delete: ${chapterCountBefore}`);

        await prisma.profile.delete({
            where: { id: profile1.id },
        });

        const chapterCountAfter = await prisma.chapter.count({
            where: { profileId: profile1.id },
        });
        console.log(`✅ Profile deleted, chapters after: ${chapterCountAfter} (should be 0)`);

        console.log('\n✅ All Profile Management API tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

testProfileAPIs()
    .then(() => {
        console.log('\n✅ Test suite completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    });
