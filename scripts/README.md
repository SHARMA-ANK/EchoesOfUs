# Data Migration Scripts

This directory contains data migration scripts for the Echoes of Us application.

## migrate-profiles.ts

This script handles the migration of existing Profile records to the new Family Archive Access Control schema.

### What it does

1. **Creates default User and Family for orphaned Profiles**: If any profiles exist without a valid `familyId`, the script creates a default user (`migration@echoes-of-us.local`) and a default family ("Migrated Family Archive") to house these profiles.

2. **Generates magic link tokens**: For any profiles that have missing or invalid `magicLinkToken` values, the script generates cryptographically secure tokens using `crypto.randomBytes(32).toString('hex')`.

3. **Preserves existing data**: All existing `shareSlug` values and other profile data are preserved during the migration.

### When to run

Run this script after:
- Applying the Prisma migrations that add the `User`, `Family`, and `Session` models
- Adding the `familyId` and `magicLinkToken` fields to the `Profile` model

### How to run

```bash
npm run migrate:data
```

Or directly:

```bash
npx tsx scripts/migrate-profiles.ts
```

### Output

The script provides detailed console output showing:
- Number of orphaned profiles found
- Default user and family creation (if needed)
- Token generation progress
- Verification results
- Migration summary

### Example output

```
Starting Profile data migration...

Step 1: Checking for orphaned profiles...
Found 2 orphaned profile(s)

Step 2: Creating default User and Family...
Created default user: migration@echoes-of-us.local (ID: clx1234567890)
Created default family: Migrated Family Archive (ID: clx0987654321)

Step 3: Assigning orphaned profiles to default family...
  ✓ Assigned profile "John Doe" (ID: clx1111111111) to default family
  ✓ Assigned profile "Jane Smith" (ID: clx2222222222) to default family

Step 4: Generating magic link tokens...
Found 2 profile(s) needing token generation
  ✓ Generated token for profile "John Doe" (ID: clx1111111111)
  ✓ Generated token for profile "Jane Smith" (ID: clx2222222222)

Step 5: Verifying migration...
  ✓ All 2 profile(s) have valid data

Migration Summary:
  - Total profiles: 2
  - Orphaned profiles migrated: 2
  - Tokens generated: 2
  - All shareSlugs preserved: ✓

Migration completed successfully!
```

### Safety

- The script is idempotent - it can be run multiple times safely
- It only modifies profiles that need migration
- All existing data is preserved
- The script validates all profiles after migration

### Post-migration

After running the migration:
1. Verify the output shows all profiles have valid data
2. Check that the default user was created (if there were orphaned profiles)
3. Inform users with migrated profiles about their new family assignment
4. Users can later move profiles to their own families through the dashboard

## test-migration.ts

A test script to verify the migration works correctly.

### How to use

1. Create test data:
```bash
npx tsx scripts/test-migration.ts
```

2. Run the migration:
```bash
npm run migrate:data
```

3. Verify the migration worked:
```bash
npx tsx scripts/test-migration.ts --verify
```

4. Clean up test data:
```bash
npx tsx scripts/test-migration.ts --cleanup
```

Or run all steps together:
```bash
npx tsx scripts/test-migration.ts && npm run migrate:data && npx tsx scripts/test-migration.ts --verify --cleanup
```
