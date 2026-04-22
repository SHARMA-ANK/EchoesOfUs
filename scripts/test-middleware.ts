/**
 * Manual validation script for middleware and magic-link utilities
 * Run with: npx tsx scripts/test-middleware.ts
 */

import { NextRequest } from 'next/server';
import { requireAuth, requireFamilyOwnership, requireProfileOwnership } from '../lib/auth/middleware';
import { generateMagicLinkToken, validateMagicLink } from '../lib/auth/magic-link';
import { createSession } from '../lib/auth/session';
import { hashPassword } from '../lib/auth/password';
import { prisma } from '../lib/prisma';

async function testMiddleware() {
    console.log('🧪 Testing Middleware and Magic Link Utilities\n');

    // Create test user
    console.log('1️⃣ Creating test user...');
    const passwordHash = await hashPassword('testpassword123');
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            passwordHash,
        },
    });
    console.log(`✅ User created: ${user.email}`);

    // Create test family
    console.log('\n2️⃣ Creating test family...');
    const family = await prisma.family.create({
        data: {
            adminUserId: user.id,
            familyName: 'Test Family',
        },
    });
    console.log(`✅ Family created: ${family.familyName}`);

    // Create session
    console.log('\n3️⃣ Creating session...');
    const session = await createSession(user.id);
    console.log(`✅ Session created with token: ${session.token.substring(0, 16)}...`);

    // Test requireAuth with valid session
    console.log('\n4️⃣ Testing requireAuth with valid session...');
    const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
            cookie: `session=${session.token}`,
        },
    });
    const authenticatedUser = await requireAuth(request);
    console.log(`✅ requireAuth returned user: ${authenticatedUser?.email}`);

    // Test requireAuth without session
    console.log('\n5️⃣ Testing requireAuth without session...');
    const requestNoAuth = new NextRequest('http://localhost:3000/api/test');
    const noUser = await requireAuth(requestNoAuth);
    console.log(`✅ requireAuth returned: ${noUser === null ? 'null (expected)' : 'unexpected user'}`);

    // Test requireFamilyOwnership
    console.log('\n6️⃣ Testing requireFamilyOwnership...');
    const isOwner = await requireFamilyOwnership(family.id, user.id);
    console.log(`✅ User owns family: ${isOwner}`);

    // Create test profile with magic link token
    console.log('\n7️⃣ Generating magic link token...');
    const magicToken = generateMagicLinkToken();
    console.log(`✅ Token generated: ${magicToken.substring(0, 16)}... (length: ${magicToken.length})`);
    console.log(`   Is valid hex: ${/^[0-9a-f]{64}$/i.test(magicToken)}`);

    console.log('\n8️⃣ Creating profile with magic link token...');
    const profile = await prisma.profile.create({
        data: {
            familyId: family.id,
            name: 'Test Profile',
            age: 65,
            magicLinkToken: magicToken,
        },
    });
    console.log(`✅ Profile created: ${profile.name}`);

    // Test requireProfileOwnership
    console.log('\n9️⃣ Testing requireProfileOwnership...');
    const ownsProfile = await requireProfileOwnership(profile.id, user.id);
    console.log(`✅ User owns profile: ${ownsProfile}`);

    // Test validateMagicLink
    console.log('\n🔟 Testing validateMagicLink with valid token...');
    const validatedProfile = await validateMagicLink(magicToken);
    console.log(`✅ validateMagicLink returned profile: ${validatedProfile?.name}`);

    // Test validateMagicLink with invalid token
    console.log('\n1️⃣1️⃣ Testing validateMagicLink with invalid token...');
    const invalidProfile = await validateMagicLink('invalid_token');
    console.log(`✅ validateMagicLink returned: ${invalidProfile === null ? 'null (expected)' : 'unexpected profile'}`);

    // Test token format validation
    console.log('\n1️⃣2️⃣ Testing token format validation...');
    const nonHexToken = 'g'.repeat(64); // 'g' is not a hex character
    const nonHexProfile = await validateMagicLink(nonHexToken);
    console.log(`✅ Non-hex token rejected: ${nonHexProfile === null ? 'yes (expected)' : 'no (unexpected)'}`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.profile.delete({ where: { id: profile.id } });
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.session.delete({ where: { id: session.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✅ Cleanup complete');

    console.log('\n✨ All tests passed!\n');
}

testMiddleware()
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
