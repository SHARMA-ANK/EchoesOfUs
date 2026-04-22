# Migration Guide: Family Archive Access Control

This guide explains how to migrate existing Profile data to the new Family Archive Access Control system.

## Overview

The Family Archive Access Control feature introduces new required fields to the Profile model:
- `familyId`: Links each profile to a Family
- `magicLinkToken`: Cryptographically secure token for interview access

Existing profiles need to be migrated to populate these fields.

## Prerequisites

Before running the migration:

1. **Backup your database**
   ```bash
   cp prisma/dev.db prisma/dev.db.backup
   ```

2. **Apply Prisma migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

## Running the Migration

### Step 1: Run the migration script

```bash
npm run migrate:data
```

Or directly:

```bash
npx tsx scripts/migrate-profiles.ts
```

### Step 2: Review the output

The script will show:
- Number of orphaned profiles found
- Default user/family creation (if needed)
- Token generation progress
- Verification results
- Migration summary

### Example output

```
Starting Profile data migration...

Step 1: Checking for orphaned profiles...
Found 0 orphaned profile(s)

No orphaned profiles found. Checking for missing magic link tokens...

Step 4: Generating magic link tokens...
Found 1 profile(s) needing token generation
  ✓ Generated token for profile "John Doe" (ID: clx1234567890)

Step 5: Verifying migration...
  ✓ All 1 profile(s) have valid data

Migration Summary:
  - Total profiles: 1
  - Orphaned profiles migrated: 0
  - Tokens generated: 1
  - All shareSlugs preserved: ✓

Migration completed successfully!
```

## What the Migration Does

### 1. Creates Default User and Family (if needed)

If any profiles exist without a valid `familyId`, the script creates:
- **Default User**: `migration@echoes-of-us.local` with a random password
- **Default Family**: "Migrated Family Archive" (unpublished)

All orphaned profiles are assigned to this default family.

### 2. Generates Magic Link Tokens

For any profiles with missing or invalid `magicLinkToken` values, the script generates new tokens using:
```typescript
crypto.randomBytes(32).toString('hex')
```

This produces 64-character hexadecimal strings that are cryptographically secure.

### 3. Preserves Existing Data

All existing profile data is preserved:
- `shareSlug` values remain unchanged
- Profile names, ages, and relations are untouched
- Associated chapters remain linked

## Post-Migration Steps

### 1. Verify Migration Success

Check that all profiles have valid data:
```bash
npx tsx scripts/test-migration.ts --verify
```

### 2. Review Default Family (if created)

If orphaned profiles were migrated to a default family:

1. Log in to the application
2. Create a proper user account for the profile owner
3. Transfer profiles from the default family to the new user's family
4. Delete the default migration user (optional)

### 3. Share Magic Links

For each profile, you can now:
1. View the magic link in the profile dashboard
2. Share the link with interview participants
3. Regenerate tokens if needed

## Testing the Migration

### Create Test Data

```bash
npx tsx scripts/test-migration.ts
```

### Run Migration

```bash
npm run migrate:data
```

### Verify Results

```bash
npx tsx scripts/test-migration.ts --verify
```

### Clean Up Test Data

```bash
npx tsx scripts/cleanup-test-data.ts
```

## Troubleshooting

### Issue: "Unique constraint failed on familyId"

**Cause**: Profiles already have a familyId assigned

**Solution**: This is expected if the migration has already run. The script is idempotent and safe to run multiple times.

### Issue: "Invalid magicLinkToken"

**Cause**: Token doesn't match the 64-character hex format

**Solution**: The migration script will automatically regenerate invalid tokens.

### Issue: "Migration user already exists"

**Cause**: The default migration user was created in a previous run

**Solution**: This is expected. The script will reuse the existing user and family.

## Rollback

If you need to rollback the migration:

1. **Restore from backup**
   ```bash
   cp prisma/dev.db.backup prisma/dev.db
   ```

2. **Revert Prisma migrations**
   ```bash
   npx prisma migrate resolve --rolled-back 20260422094030_add_user_and_family_models
   ```

3. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

## Support

For issues or questions:
1. Check the migration script output for error messages
2. Review the `scripts/README.md` for detailed documentation
3. Verify your Prisma schema matches the design document
