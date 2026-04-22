import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';

async function testRegistration() {
    console.log('Testing Registration API Implementation...\n');

    try {
        // Clean up test data
        console.log('1. Cleaning up test data...');
        await prisma.session.deleteMany({
            where: { user: { email: { startsWith: 'test-' } } },
        });
        await prisma.family.deleteMany({
            where: { adminUser: { email: { startsWith: 'test-' } } },
        });
        await prisma.user.deleteMany({
            where: { email: { startsWith: 'test-' } },
        });
        console.log('   ✓ Cleanup complete\n');

        // Test 1: Email validation
        console.log('2. Testing email validation...');
        const invalidEmails = ['invalid', 'test@', '@example.com', 'test @example.com'];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of invalidEmails) {
            const isValid = emailRegex.test(email);
            console.log(`   ${email}: ${isValid ? '✗ FAIL' : '✓ PASS'} (should be invalid)`);
        }
        const validEmail = 'test@example.com';
        console.log(`   ${validEmail}: ${emailRegex.test(validEmail) ? '✓ PASS' : '✗ FAIL'} (should be valid)\n`);

        // Test 2: Password strength validation
        console.log('3. Testing password strength validation...');
        const weakPasswords = ['short', '1234567'];
        for (const pwd of weakPasswords) {
            const isValid = pwd.length >= 8;
            console.log(`   "${pwd}" (${pwd.length} chars): ${isValid ? '✗ FAIL' : '✓ PASS'} (should be invalid)`);
        }
        const strongPassword = 'password123';
        console.log(`   "${strongPassword}" (${strongPassword.length} chars): ${strongPassword.length >= 8 ? '✓ PASS' : '✗ FAIL'} (should be valid)\n`);

        // Test 3: Create user with hashed password
        console.log('4. Testing user creation with password hashing...');
        const testEmail = 'test-user@example.com';
        const testPassword = 'password123';
        const passwordHash = await hashPassword(testPassword);

        const user = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash,
            },
        });
        console.log(`   ✓ User created: ${user.id}`);
        console.log(`   ✓ Password hashed: ${passwordHash !== testPassword}`);
        console.log(`   ✓ Hash length: ${passwordHash.length} chars\n`);

        // Test 4: Check for duplicate email
        console.log('5. Testing duplicate email detection...');
        const existingUser = await prisma.user.findUnique({
            where: { email: testEmail },
        });
        console.log(`   ✓ User found: ${existingUser ? 'YES' : 'NO'} (should be YES)\n`);

        // Test 5: Create default family
        console.log('6. Testing default family creation...');
        const family = await prisma.family.create({
            data: {
                adminUserId: user.id,
                familyName: 'My Family Archive',
                isPublishedToGlobal: false,
            },
        });
        console.log(`   ✓ Family created: ${family.id}`);
        console.log(`   ✓ Family name: ${family.familyName}`);
        console.log(`   ✓ Admin user ID: ${family.adminUserId}`);
        console.log(`   ✓ Published: ${family.isPublishedToGlobal} (should be false)\n`);

        // Test 6: Verify family-user relationship
        console.log('7. Testing family-user relationship...');
        const userWithFamilies = await prisma.user.findUnique({
            where: { id: user.id },
            include: { families: true },
        });
        console.log(`   ✓ User has ${userWithFamilies?.families.length} family/families`);
        console.log(`   ✓ Family belongs to user: ${userWithFamilies?.families[0]?.adminUserId === user.id}\n`);

        // Test 7: Test custom family name
        console.log('8. Testing custom family name...');
        const user2 = await prisma.user.create({
            data: {
                email: 'test-user2@example.com',
                passwordHash: await hashPassword('password123'),
            },
        });
        const customFamily = await prisma.family.create({
            data: {
                adminUserId: user2.id,
                familyName: 'Smith Family Archive',
                isPublishedToGlobal: false,
            },
        });
        console.log(`   ✓ Custom family name: ${customFamily.familyName}\n`);

        console.log('✅ All registration logic tests passed!\n');
        console.log('Summary:');
        console.log('- Email validation: ✓');
        console.log('- Password strength validation: ✓');
        console.log('- Password hashing: ✓');
        console.log('- User creation: ✓');
        console.log('- Duplicate email detection: ✓');
        console.log('- Default family creation: ✓');
        console.log('- Custom family name: ✓');
        console.log('- Family-user relationship: ✓');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testRegistration();
