import { prisma } from '../lib/prisma';

async function testRegistrationAPI() {
    console.log('Testing Registration API Endpoint...\n');

    const baseUrl = 'http://localhost:3000';

    try {
        // Clean up test data
        console.log('1. Cleaning up test data...');
        await prisma.session.deleteMany({
            where: { user: { email: { startsWith: 'api-test-' } } },
        });
        await prisma.family.deleteMany({
            where: { adminUser: { email: { startsWith: 'api-test-' } } },
        });
        await prisma.user.deleteMany({
            where: { email: { startsWith: 'api-test-' } },
        });
        console.log('   ✓ Cleanup complete\n');

        // Test 1: Successful registration
        console.log('2. Testing successful registration...');
        const response1 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'api-test-user@example.com',
                password: 'password123',
                familyName: 'Test Family',
            }),
        });

        if (response1.status === 201) {
            const data1 = await response1.json();
            console.log(`   ✓ Status: 201 Created`);
            console.log(`   ✓ User ID: ${data1.userId}`);
            console.log(`   ✓ Family ID: ${data1.familyId}`);

            // Check for session cookie
            const cookies = response1.headers.get('set-cookie');
            console.log(`   ✓ Session cookie set: ${cookies?.includes('session=') ? 'YES' : 'NO'}\n`);
        } else {
            console.log(`   ✗ FAIL: Expected 201, got ${response1.status}`);
            console.log(`   Response: ${await response1.text()}\n`);
        }

        // Test 2: Missing email
        console.log('3. Testing missing email (should return 400)...');
        const response2 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: 'password123',
            }),
        });
        console.log(`   ${response2.status === 400 ? '✓' : '✗'} Status: ${response2.status} (expected 400)\n`);

        // Test 3: Invalid email format
        console.log('4. Testing invalid email format (should return 400)...');
        const response3 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'invalid-email',
                password: 'password123',
            }),
        });
        console.log(`   ${response3.status === 400 ? '✓' : '✗'} Status: ${response3.status} (expected 400)\n`);

        // Test 4: Weak password
        console.log('5. Testing weak password (should return 400)...');
        const response4 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'api-test-weak@example.com',
                password: 'short',
            }),
        });
        console.log(`   ${response4.status === 400 ? '✓' : '✗'} Status: ${response4.status} (expected 400)\n`);

        // Test 5: Duplicate email
        console.log('6. Testing duplicate email (should return 409)...');
        const response5 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'api-test-user@example.com', // Same as first test
                password: 'password456',
            }),
        });
        console.log(`   ${response5.status === 409 ? '✓' : '✗'} Status: ${response5.status} (expected 409)\n`);

        // Test 6: Default family name
        console.log('7. Testing default family name...');
        const response6 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'api-test-default@example.com',
                password: 'password123',
            }),
        });

        if (response6.status === 201) {
            const data6 = await response6.json();
            const family = await prisma.family.findUnique({
                where: { id: data6.familyId },
            });
            console.log(`   ✓ Status: 201 Created`);
            console.log(`   ✓ Default family name: ${family?.familyName} (expected "My Family Archive")\n`);
        } else {
            console.log(`   ✗ FAIL: Expected 201, got ${response6.status}\n`);
        }

        console.log('✅ All API endpoint tests completed!\n');
        console.log('Note: Make sure the Next.js dev server is running on http://localhost:3000');

    } catch (error) {
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
            console.error('❌ Error: Could not connect to server.');
            console.error('   Please start the Next.js dev server with: npm run dev');
        } else {
            console.error('❌ Test failed:', error);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testRegistrationAPI();
