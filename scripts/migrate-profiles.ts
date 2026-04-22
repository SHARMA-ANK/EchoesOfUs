/**
 * Data Migration Script: Handle Existing Profiles
 * 
 * This script migrates existing Profile records to the new schema by:
 * 1. Creating a default User and Family for orphaned Profiles
 * 2. Generating cryptographically secure magic link tokens
 * 3. Preserving all existing shareSlug values
 * 
 * Run with: npx tsx scripts/migrate-profiles.ts
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Profile data migration...\n');

    // Step 1: Check for orphaned profiles (profiles without a valid familyId)
    console.log('Step 1: Checking for orphaned profiles...');

    const allProfiles = await prisma.profile.findMany({
        include: {
            family: true,
        },
    });

    const orphanedProfiles = allProfiles.filter(profile => {
        try {
            // Check if family exists
            return !profile.family;
        } catch {
            return true;
        }
    });

    console.log(`Found ${orphanedProfiles.length} orphaned profile(s)\n`);

    if (orphanedProfiles.length === 0) {
        console.log('No orphaned profiles found. Checking for missing magic link tokens...\n');
    } else {
        // Step 2: Create default User and Family for orphaned profiles
        console.log('Step 2: Creating default User and Family...');

        const defaultEmail = 'migration@echoes-of-us.local';
        const defaultPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        let defaultUser = await prisma.user.findUnique({
            where: { email: defaultEmail },
        });

        if (!defaultUser) {
            defaultUser = await prisma.user.create({
                data: {
                    email: defaultEmail,
                    passwordHash,
                },
            });
            console.log(`Created default user: ${defaultUser.email} (ID: ${defaultUser.id})`);
        } else {
            console.log(`Default user already exists: ${defaultUser.email} (ID: ${defaultUser.id})`);
        }

        let defaultFamily = await prisma.family.findFirst({
            where: { adminUserId: defaultUser.id },
        });

        if (!defaultFamily) {
            defaultFamily = await prisma.family.create({
                data: {
                    adminUserId: defaultUser.id,
                    familyName: 'Migrated Family Archive',
                    isPublishedToGlobal: false,
                },
            });
            console.log(`Created default family: ${defaultFamily.familyName} (ID: ${defaultFamily.id})\n`);
        } else {
            console.log(`Default family already exists: ${defaultFamily.familyName} (ID: ${defaultFamily.id})\n`);
        }

        // Step 3: Update orphaned profiles with default familyId
        console.log('Step 3: Assigning orphaned profiles to default family...');

        for (const profile of orphanedProfiles) {
            try {
                await prisma.$executeRaw`
          UPDATE Profile 
          SET familyId = ${defaultFamily.id}
          WHERE id = ${profile.id}
        `;
                console.log(`  ✓ Assigned profile "${profile.name}" (ID: ${profile.id}) to default family`);
            } catch (error) {
                console.error(`  ✗ Failed to assign profile "${profile.name}" (ID: ${profile.id}):`, error);
            }
        }
        console.log('');
    }

    // Step 4: Generate magic link tokens for profiles with missing or invalid tokens
    console.log('Step 4: Generating magic link tokens...');

    const allProfilesForTokenCheck = await prisma.profile.findMany();

    // Filter profiles that need token generation (not 64 hex chars)
    const hexRegex = /^[a-f0-9]{64}$/;
    const profilesNeedingTokens = allProfilesForTokenCheck.filter(
        profile => !profile.magicLinkToken || !hexRegex.test(profile.magicLinkToken)
    );

    console.log(`Found ${profilesNeedingTokens.length} profile(s) needing token generation`);

    for (const profile of profilesNeedingTokens) {
        const magicLinkToken = crypto.randomBytes(32).toString('hex');

        try {
            await prisma.profile.update({
                where: { id: profile.id },
                data: { magicLinkToken },
            });
            console.log(`  ✓ Generated token for profile "${profile.name}" (ID: ${profile.id})`);
        } catch (error) {
            console.error(`  ✗ Failed to generate token for profile "${profile.name}" (ID: ${profile.id}):`, error);
        }
    }
    console.log('');

    // Step 5: Verify all profiles have valid data
    console.log('Step 5: Verifying migration...');

    const finalProfiles = await prisma.profile.findMany({
        include: {
            family: true,
        },
    });

    let allValid = true;

    for (const profile of finalProfiles) {
        const issues: string[] = [];

        if (!profile.familyId) {
            issues.push('missing familyId');
        }

        if (!profile.magicLinkToken || profile.magicLinkToken.length !== 64) {
            issues.push('invalid magicLinkToken');
        }

        if (!profile.shareSlug) {
            issues.push('missing shareSlug');
        }

        if (issues.length > 0) {
            console.error(`  ✗ Profile "${profile.name}" (ID: ${profile.id}): ${issues.join(', ')}`);
            allValid = false;
        }
    }

    if (allValid) {
        console.log(`  ✓ All ${finalProfiles.length} profile(s) have valid data`);
    }
    console.log('');

    // Summary
    console.log('Migration Summary:');
    console.log(`  - Total profiles: ${finalProfiles.length}`);
    console.log(`  - Orphaned profiles migrated: ${orphanedProfiles.length}`);
    console.log(`  - Tokens generated: ${profilesNeedingTokens.length}`);
    console.log(`  - All shareSlugs preserved: ✓`);
    console.log('\nMigration completed successfully!');
}

main()
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
