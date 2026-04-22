import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { createSession } from '../lib/auth/session';

async function verifyTask16_1() {
    console.log('🔍 Verifying Task 16.1: Create Profile POST Endpoint\n');

    try {
        // Setup: Create test user and family
        console.log('Setting up test data...');
        await prisma.session.deleteMany({ where: { user: { email: 'verify-16-1@test.com' } } });
        await prisma.profile.deleteMany({ where: { family: { adminUser: { email: 'verify-16-1@test.com' } } } });
        await prisma.family.deleteMany({ where: { adminUser: { email: 'verify-16-1@test.com' } } });
        await prisma.user.deleteMany({ where: { email: 'verify-16-1@test.com' } });

        const user = await prisma.user.create({
            data: {
                email: 'verify-16-1@test.com',
                passwordHash: await hashPassword('password123'),
            },
        });

        const family = await prisma.family.create({
            data: {
                adminUserId: user.id,
                familyName: 'Verification Family',
            },
        });

        const session = await createSession(user.id);
        console.log('✅ Test data created\n');

        // Verify Sub-task 16.1.1: Require authentication
        console.log('📝 Sub-task 16.1.1: Require authentication');
        const unauthResponse = await fetch('http://localhost:3000/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                familyId: family.id,
                name: 'Test Profile',
                age: 30,
            }),
        });
        console.log(`   Status: ${unauthResponse.status} (expected 401)`);
        if (unauthResponse.status === 401) {
            console.log('   ✅ PASS: Returns 401 without authentication\n');
        } else {
            throw new Error('FAIL: Should return 401 without authentication');
        }

        // Verify Sub-task 16.1.2: Verify family ownership
        console.log('📝 Sub-task 16.1.2: Verify family ownership');
        const otherUser = await prisma.user.create({
            data: {
                email: 'other-16-1@test.com',
                passwordHash: await hashPassword('password123'),
            },
        });
        const otherFamily = await prisma.family.create({
            data: {
                adminUserId: otherUser.id,
                familyName: 'Other Family',
            },
        });

        const forbiddenResponse = await fetch('http://localhost:3000/api/profiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `session=${session.token}`,
            },
            body: JSON.stringify({
                familyId: otherFamily.id,
                name: 'Unauthorized Profile',
                age: 30,
            }),
        });
        console.log(`   Status: ${forbiddenResponse.status} (expected 403)`);
        if (forbiddenResponse.status === 403) {
            console.log('   ✅ PASS: Returns 403 when family not owned\n');
        } else {
            throw new Error('FAIL: Should return 403 when family not owned');
        }

        // Verify Sub-tasks 16.1.3, 16.1.4, 16.1.5: Create profile with token
        console.log('📝 Sub-tasks 16.1.3, 16.1.4, 16.1.5: Create profile with magic link token');
        const createResponse = await fetch('http://localhost:3000/api/profiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `session=${session.token}`,
            },
            body: JSON.stringify({
                familyId: family.id,
                name: 'Grandpa Joe',
                age: 82,
                relation: 'Grandfather',
            }),
        });

        console.log(`   Status: ${createResponse.status} (expected 201)`);
        if (createResponse.status !== 201) {
            throw new Error(`FAIL: Should return 201, got ${createResponse.status}`);
        }

        const profile = await createResponse.json();
        console.log(`   Profile created: ${profile.name}, age ${profile.age}`);
        console.log(`   Family ID: ${profile.familyId}`);
        console.log(`   Magic Link Token: ${profile.magicLinkToken.substring(0, 20)}...`);
        console.log(`   Token length: ${profile.magicLinkToken.length} chars`);

        // Verify token properties
        if (profile.magicLinkToken.length !== 64) {
            throw new Error(`FAIL: Token should be 64 chars, got ${profile.magicLinkToken.length}`);
        }
        if (!/^[0-9a-f]{64}$/i.test(profile.magicLinkToken)) {
            throw new Error('FAIL: Token should be hexadecimal');
        }
        if (profile.familyId !== family.id) {
            throw new Error('FAIL: Profile should be associated with correct family');
        }

        console.log('   ✅ PASS: Profile created with valid magic link token\n');

        // Verify token uniqueness
        console.log('📝 Bonus: Verify token uniqueness');
        const profile2Response = await fetch('http://localhost:3000/api/profiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `session=${session.token}`,
            },
            body: JSON.stringify({
                familyId: family.id,
                name: 'Grandma Jane',
                age: 80,
                relation: 'Grandmother',
            }),
        });

        const profile2 = await profile2Response.json();
        if (profile.magicLinkToken === profile2.magicLinkToken) {
            throw new Error('FAIL: Tokens should be unique');
        }
        console.log('   ✅ PASS: Each profile gets a unique token\n');

        console.log('✅ Task 16.1 VERIFIED: All sub-tasks implemented correctly!');
        console.log('\nSummary:');
        console.log('  ✅ 16.1.1 Require authentication');
        console.log('  ✅ 16.1.2 Verify family ownership');
        console.log('  ✅ 16.1.3 Generate cryptographically secure magicLinkToken');
        console.log('  ✅ 16.1.4 Create Profile with familyId');
        console.log('  ✅ 16.1.5 Return 201 with Profile (including token) or 401/403');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    }
}

verifyTask16_1()
    .then(() => {
        console.log('\n✅ Verification completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    });
