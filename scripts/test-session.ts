/**
 * Manual test script for session management functions
 * Run with: npx tsx scripts/test-session.ts
 */

import { createSession, validateSession, renewSession, destroySession } from '../lib/auth/session';
import { prisma } from '../lib/prisma';

async function testSessionManagement() {
    console.log('🧪 Testing Session Management Functions\n');

    try {
        // Create a test user
        console.log('1. Creating test user...');
        const testUser = await prisma.user.create({
            data: {
                email: `test-session-${Date.now()}@example.com`,
                passwordHash: 'test-hash-value',
            },
        });
        console.log(`✅ Created user: ${testUser.email} (ID: ${testUser.id})\n`);

        // Test createSession
        console.log('2. Testing createSession...');
        const session = await createSession(testUser.id);
        console.log(`✅ Session created:`);
        console.log(`   - Token length: ${session.token.length} (expected: 64)`);
        console.log(`   - Token format: ${/^[0-9a-f]{64}$/.test(session.token) ? 'Valid hex' : 'Invalid'}`);
        console.log(`   - Expires at: ${session.expiresAt.toISOString()}`);

        const daysUntilExpiry = (session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        console.log(`   - Days until expiry: ${daysUntilExpiry.toFixed(2)} (expected: ~30)\n`);

        // Test validateSession with valid token
        console.log('3. Testing validateSession with valid token...');
        const validatedUser = await validateSession(session.token);
        if (validatedUser && validatedUser.id === testUser.id) {
            console.log(`✅ Session validated successfully`);
            console.log(`   - User ID: ${validatedUser.id}`);
            console.log(`   - Email: ${validatedUser.email}\n`);
        } else {
            console.log(`❌ Session validation failed\n`);
        }

        // Test validateSession with invalid token
        console.log('4. Testing validateSession with invalid token...');
        const invalidUser = await validateSession('invalid-token');
        if (invalidUser === null) {
            console.log(`✅ Invalid token correctly rejected\n`);
        } else {
            console.log(`❌ Invalid token was accepted\n`);
        }

        // Test renewSession
        console.log('5. Testing renewSession...');
        const originalExpiration = session.expiresAt.getTime();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        await renewSession(session.token);

        const renewedSession = await prisma.session.findUnique({
            where: { token: session.token },
        });

        if (renewedSession && renewedSession.expiresAt.getTime() > originalExpiration) {
            console.log(`✅ Session renewed successfully`);
            console.log(`   - Original expiration: ${new Date(originalExpiration).toISOString()}`);
            console.log(`   - New expiration: ${renewedSession.expiresAt.toISOString()}\n`);
        } else {
            console.log(`❌ Session renewal failed\n`);
        }

        // Test destroySession
        console.log('6. Testing destroySession...');
        await destroySession(session.token);

        const destroyedSession = await prisma.session.findUnique({
            where: { token: session.token },
        });

        if (destroyedSession === null) {
            console.log(`✅ Session destroyed successfully\n`);
        } else {
            console.log(`❌ Session was not destroyed\n`);
        }

        // Test validateSession after destruction
        console.log('7. Testing validateSession after destruction...');
        const destroyedUser = await validateSession(session.token);
        if (destroyedUser === null) {
            console.log(`✅ Destroyed session correctly returns null\n`);
        } else {
            console.log(`❌ Destroyed session still validates\n`);
        }

        // Test expired session
        console.log('8. Testing expired session handling...');
        const expiredSession = await prisma.session.create({
            data: {
                userId: testUser.id,
                token: 'a'.repeat(64),
                expiresAt: new Date(Date.now() - 1000), // 1 second ago
            },
        });

        const expiredUser = await validateSession(expiredSession.token);
        if (expiredUser === null) {
            console.log(`✅ Expired session correctly rejected\n`);
        } else {
            console.log(`❌ Expired session was accepted\n`);
        }

        // Cleanup
        console.log('9. Cleaning up test data...');
        await prisma.session.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
        console.log(`✅ Test data cleaned up\n`);

        console.log('✨ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testSessionManagement();
