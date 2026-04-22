/**
 * Test script for Family Management API routes
 * Tests Tasks 11-14: GET, POST, PATCH, DELETE /api/families
 */

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

async function testFamilyAPIs() {
    console.log('🧪 Testing Family Management APIs...\n');

    let testUser: any;
    let testSession: any;
    let testFamily: any;
    let otherUser: any;
    let otherSession: any;

    try {
        // Setup: Create test user
        console.log('📝 Setup: Creating test user...');
        testUser = await prisma.user.create({
            data: {
                email: `test-family-apis-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });
        testSession = await createSession(testUser.id);
        console.log(`✅ Created test user: ${testUser.email}`);

        // Setup: Create another user for ownership tests
        otherUser = await prisma.user.create({
            data: {
                email: `other-family-apis-${Date.now()}@example.com`,
                passwordHash: await hashPassword('password123'),
            },
        });
        otherSession = await createSession(otherUser.id);
        console.log(`✅ Created other user: ${otherUser.email}\n`);

        // Test 1: POST /api/families - Create family
        console.log('Test 1: POST /api/families - Create family');
        const createResponse = await fetch('http://localhost:3000/api/families', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session=${testSession.token}`,
            },
            body: JSON.stringify({ familyName: 'Test Family Archive' }),
        });

        if (createResponse.status === 201) {
            testFamily = await createResponse.json();
            console.log(`✅ Created family: ${testFamily.familyName}`);
            console.log(`   - ID: ${testFamily.id}`);
            console.log(`   - Admin User ID: ${testFamily.adminUserId}`);
            console.log(`   - Published: ${testFamily.isPublishedToGlobal}`);
        } else {
            const error = await createResponse.json();
            console.log(`❌ Failed to create family: ${error.error}`);
            throw new Error('Family creation failed');
        }

        // Test 2: POST /api/families - Unauthenticated (should fail)
        console.log('\nTest 2: POST /api/families - Unauthenticated (should return 401)');
        const unauthCreateResponse = await fetch('http://localhost:3000/api/families', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ familyName: 'Unauthorized Family' }),
        });

        if (unauthCreateResponse.status === 401) {
            console.log('✅ Correctly rejected unauthenticated request');
        } else {
            console.log(`❌ Expected 401, got ${unauthCreateResponse.status}`);
        }

        // Test 3: GET /api/families - Fetch families
        console.log('\nTest 3: GET /api/families - Fetch families');
        const getResponse = await fetch('http://localhost:3000/api/families', {
            headers: {
                'Cookie': `session=${testSession.token}`,
            },
        });

        if (getResponse.status === 200) {
            const families = await getResponse.json();
            console.log(`✅ Fetched ${families.length} family/families`);
            if (families.length > 0) {
                console.log(`   - First family: ${families[0].familyName}`);
                console.log(`   - Includes profiles: ${families[0].profiles !== undefined}`);
            }
        } else {
            console.log(`❌ Failed to fetch families: ${getResponse.status}`);
        }

        // Test 4: GET /api/families - Unauthenticated (should fail)
        console.log('\nTest 4: GET /api/families - Unauthenticated (should return 401)');
        const unauthGetResponse = await fetch('http://localhost:3000/api/families');

        if (unauthGetResponse.status === 401) {
            console.log('✅ Correctly rejected unauthenticated request');
        } else {
            console.log(`❌ Expected 401, got ${unauthGetResponse.status}`);
        }

        // Test 5: PATCH /api/families/[id] - Update family name
        console.log('\nTest 5: PATCH /api/families/[id] - Update family name');
        const patchNameResponse = await fetch(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session=${testSession.token}`,
            },
            body: JSON.stringify({ familyName: 'Updated Family Name' }),
        });

        if (patchNameResponse.status === 200) {
            const updatedFamily = await patchNameResponse.json();
            console.log(`✅ Updated family name to: ${updatedFamily.familyName}`);
        } else {
            const error = await patchNameResponse.json();
            console.log(`❌ Failed to update family: ${error.error}`);
        }

        // Test 6: PATCH /api/families/[id] - Toggle publish status
        console.log('\nTest 6: PATCH /api/families/[id] - Toggle publish status');
        const patchPublishResponse = await fetch(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session=${testSession.token}`,
            },
            body: JSON.stringify({ isPublishedToGlobal: true }),
        });

        if (patchPublishResponse.status === 200) {
            const updatedFamily = await patchPublishResponse.json();
            console.log(`✅ Updated publish status to: ${updatedFamily.isPublishedToGlobal}`);
        } else {
            const error = await patchPublishResponse.json();
            console.log(`❌ Failed to update publish status: ${error.error}`);
        }

        // Test 7: PATCH /api/families/[id] - Unauthorized user (should fail)
        console.log('\nTest 7: PATCH /api/families/[id] - Unauthorized user (should return 403)');
        const unauthorizedPatchResponse = await fetch(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session=${otherSession.token}`,
            },
            body: JSON.stringify({ familyName: 'Hacked Name' }),
        });

        if (unauthorizedPatchResponse.status === 403) {
            console.log('✅ Correctly rejected unauthorized update');
        } else {
            console.log(`❌ Expected 403, got ${unauthorizedPatchResponse.status}`);
        }

        // Test 8: PATCH /api/families/[id] - Non-existent family (should return 404)
        console.log('\nTest 8: PATCH /api/families/[id] - Non-existent family (should return 404)');
        const notFoundPatchResponse = await fetch('http://localhost:3000/api/families/nonexistent', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session=${testSession.token}`,
            },
            body: JSON.stringify({ familyName: 'New Name' }),
        });

        if (notFoundPatchResponse.status === 404) {
            console.log('✅ Correctly returned 404 for non-existent family');
        } else {
            console.log(`❌ Expected 404, got ${notFoundPatchResponse.status}`);
        }

        // Test 9: Create profile and chapter for cascade delete test
        console.log('\nTest 9: Setup - Creating profile and chapter for cascade delete test');
        const profile = await prisma.profile.create({
            data: {
                familyId: testFamily.id,
                name: 'Test Profile',
                age: 65,
                relation: 'Grandfather',
            },
        });

        const chapter = await prisma.chapter.create({
            data: {
                profileId: profile.id,
                chapterNumber: 1,
                title: 'Test Chapter',
            },
        });
        console.log(`✅ Created profile (${profile.id}) and chapter (${chapter.id})`);

        // Test 10: DELETE /api/families/[id] - Unauthorized user (should fail)
        console.log('\nTest 10: DELETE /api/families/[id] - Unauthorized user (should return 403)');
        const unauthorizedDeleteResponse = await fetch(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'DELETE',
            headers: {
                'Cookie': `session=${otherSession.token}`,
            },
        });

        if (unauthorizedDeleteResponse.status === 403) {
            console.log('✅ Correctly rejected unauthorized delete');
        } else {
            console.log(`❌ Expected 403, got ${unauthorizedDeleteResponse.status}`);
        }

        // Test 11: DELETE /api/families/[id] - Delete family with cascade
        console.log('\nTest 11: DELETE /api/families/[id] - Delete family with cascade');
        const deleteResponse = await fetch(`http://localhost:3000/api/families/${testFamily.id}`, {
            method: 'DELETE',
            headers: {
                'Cookie': `session=${testSession.token}`,
            },
        });

        if (deleteResponse.status === 200) {
            const result = await deleteResponse.json();
            console.log(`✅ Deleted family: ${result.success}`);

            // Verify cascade deletion
            const deletedProfile = await prisma.profile.findUnique({
                where: { id: profile.id },
            });
            const deletedChapter = await prisma.chapter.findUnique({
                where: { id: chapter.id },
            });

            if (!deletedProfile && !deletedChapter) {
                console.log('✅ Cascade deletion verified: profile and chapter deleted');
            } else {
                console.log('❌ Cascade deletion failed: profile or chapter still exists');
            }
        } else {
            const error = await deleteResponse.json();
            console.log(`❌ Failed to delete family: ${error.error}`);
        }

        // Test 12: DELETE /api/families/[id] - Non-existent family (should return 404)
        console.log('\nTest 12: DELETE /api/families/[id] - Non-existent family (should return 404)');
        const notFoundDeleteResponse = await fetch('http://localhost:3000/api/families/nonexistent', {
            method: 'DELETE',
            headers: {
                'Cookie': `session=${testSession.token}`,
            },
        });

        if (notFoundDeleteResponse.status === 404) {
            console.log('✅ Correctly returned 404 for non-existent family');
        } else {
            console.log(`❌ Expected 404, got ${notFoundDeleteResponse.status}`);
        }

        console.log('\n✅ All tests completed!');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        if (testUser) {
            await prisma.family.deleteMany({ where: { adminUserId: testUser.id } });
            await prisma.session.deleteMany({ where: { userId: testUser.id } });
            await prisma.user.delete({ where: { id: testUser.id } });
            console.log('✅ Cleaned up test user');
        }
        if (otherUser) {
            await prisma.family.deleteMany({ where: { adminUserId: otherUser.id } });
            await prisma.session.deleteMany({ where: { userId: otherUser.id } });
            await prisma.user.delete({ where: { id: otherUser.id } });
            console.log('✅ Cleaned up other user');
        }
        await prisma.$disconnect();
    }
}

// Run tests
testFamilyAPIs();
