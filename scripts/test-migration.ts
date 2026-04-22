/**
 * Test Script for Profile Migration
 * 
 * This script creates test data and verifies the migration works correctly.
 * 
 * Run with: npx tsx scripts/test-migration.ts
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestData() {
    console.log('Creating test data...\n');

    // Create a test user and family
    const testUser = await prisma.user.create({
        data: {
            email: 'test@example.com',
            passwordHash: await bcrypt.hash('testpassword', 10),
        },
    });
    console.log(`Created test user: ${testUser.email}`);

    const testFamily = await prisma.family.create({
        data: {
            adminUserId: testUser.id,
            familyName: 'Test Family',
            isPublishedToGlobal: false,
        },
    });
    console.log(`Created test family: ${testFamily.familyName}`);

    // Create a profile with valid data
    const validProfile = await prisma.profile.create({
        data: {
            familyId: testFamily.id,
            name: 'Valid Profile',
            age: 65,
            relation: 'Grandfather',
            shareSlug: crypto.randomBytes(16).toString('hex'),
            magicLinkToken: crypto.randomBytes(32).toString('hex'),
        },
    });
    console.log(`Created valid profile: ${validProfile.name}`);

    // Create a profile with invalid token (using raw SQL to bypass Prisma validation)
    const invalidTokenProfile = await prisma.profile.create({
        data: {
            familyId: testFamily.id,
            name: 'Invalid Token Profile',
            age: 70,
            relation: 'Grandmother',
            shareSlug: crypto.randomBytes(16).toString('hex'),
            magicLinkToken: 'short-token', // Invalid - not 64 hex chars
        },
    });
    console.log(`Created profile with invalid token: ${invalidTokenProfile.name}`);

    console.log('\nTest data created successfully!\n');

    return {
        testUser,
        testFamily,
        validProfile,
        invalidTokenProfile,
    };
}

async function verifyMigration() {
    console.log('\nVerifying migration results...\n');

    const profiles = await prisma.profile.findMany({
        include: {
            family: true,
        },
    });

    let allValid = true;
    const hexRegex = /^[a-f0-9]{64}$/;

    for (const profile of profiles) {
        const checks = {
            hasFamily: !!profile.family,
            hasFamilyId: !!profile.familyId,
            hasValidToken: profile.magicLinkToken && hexRegex.test(profile.magicLinkToken),
            hasShareSlug: !!profile.shareSlug,
        };

        const status = Object.values(checks).every(v => v) ? '✓' : '✗';
        console.log(`${status} Profile: ${profile.name}`);
        console.log(`  - Family: ${checks.hasFamily ? profile.family.familyName : 'MISSING'}`);
        console.log(`  - Family ID: ${checks.hasFamilyId ? 'Valid' : 'MISSING'}`);
        console.log(`  - Magic Link Token: ${checks.hasValidToken ? 'Valid (64 hex chars)' : 'INVALID'}`);
        console.log(`  - Share Slug: ${checks.hasShareSlug ? 'Present' : 'MISSING'}`);
        console.log('');

        if (!Object.values(checks).every(v => v)) {
            allValid = false;
        }
    }

    return allValid;
}

async function cleanup() {
    console.log('\nCleaning up test data...');

    // Delete test user (cascade will delete family and profiles)
    await prisma.user.deleteMany({
        where: {
            email: {
                in: ['test@example.com', 'migration@echoes-of-us.local'],
            },
        },
    });

    console.log('Test data cleaned up successfully!\n');
}

async function main() {
    console.log('=== Profile Migration Test ===\n');

    try {
        // Check if --verify flag is present
        const shouldVerify = process.argv.includes('--verify');
        const shouldCleanup = process.argv.includes('--cleanup');

        if (shouldVerify) {
            // Just verify, don't create new data
            const allValid = await verifyMigration();

            if (allValid) {
                console.log('✓ All profiles have valid data after migration!');
            } else {
                console.log('✗ Some profiles have invalid data. Migration may have failed.');
                process.exit(1);
            }
        } else {
            // Step 1: Create test data
            await createTestData();

            console.log('Now run: npm run migrate:data\n');
            console.log('After running the migration, run this script again with --verify flag to check results.\n');
        }

        // Check if --cleanup flag is present
        if (shouldCleanup) {
            await cleanup();
        }

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
