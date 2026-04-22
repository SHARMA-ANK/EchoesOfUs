/**
 * Test script for authentication APIs (login, logout, session)
 * Run with: npx tsx scripts/test-auth-apis.ts
 */

import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';

const BASE_URL = 'http://localhost:3000';

async function setupTestUser() {
    const email = `test-auth-${Date.now()}@example.com`;
    const password = 'testpassword123';
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
        },
    });

    console.log('✓ Created test user:', email);
    return { user, email, password };
}

async function testLogin(email: string, password: string) {
    console.log('\n--- Testing Login API ---');

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    const cookies = response.headers.get('set-cookie');

    console.log('Status:', response.status);
    console.log('Response:', data);
    console.log('Cookies:', cookies ? 'Set' : 'Not set');

    if (response.status === 200 && data.userId && cookies) {
        console.log('✓ Login successful');
        return cookies;
    } else {
        throw new Error('Login failed');
    }
}

async function testInvalidLogin() {
    console.log('\n--- Testing Invalid Login ---');

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
        }),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.status === 401) {
        console.log('✓ Invalid login correctly rejected');
    } else {
        throw new Error('Invalid login should return 401');
    }
}

async function testSessionCheck(cookies: string) {
    console.log('\n--- Testing Session Check API ---');

    const response = await fetch(`${BASE_URL}/api/auth/session`, {
        method: 'GET',
        headers: { Cookie: cookies },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.status === 200 && data && data.userId && data.email) {
        console.log('✓ Session check successful');
        return data;
    } else {
        throw new Error('Session check failed');
    }
}

async function testSessionCheckWithoutCookie() {
    console.log('\n--- Testing Session Check Without Cookie ---');

    const response = await fetch(`${BASE_URL}/api/auth/session`, {
        method: 'GET',
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.status === 200 && data === null) {
        console.log('✓ Session check without cookie returns null');
    } else {
        throw new Error('Session check without cookie should return null');
    }
}

async function testLogout(cookies: string) {
    console.log('\n--- Testing Logout API ---');

    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookies },
    });

    const data = await response.json();
    const setCookies = response.headers.get('set-cookie');

    console.log('Status:', response.status);
    console.log('Response:', data);
    console.log('Cookie cleared:', setCookies ? 'Yes' : 'No');

    if (response.status === 200 && data.success) {
        console.log('✓ Logout successful');
    } else {
        throw new Error('Logout failed');
    }
}

async function testSessionAfterLogout(cookies: string) {
    console.log('\n--- Testing Session Check After Logout ---');

    const response = await fetch(`${BASE_URL}/api/auth/session`, {
        method: 'GET',
        headers: { Cookie: cookies },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.status === 200 && data === null) {
        console.log('✓ Session correctly invalidated after logout');
    } else {
        throw new Error('Session should be null after logout');
    }
}

async function cleanup(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    console.log('\n✓ Cleaned up test user');
}

async function main() {
    console.log('Starting authentication API tests...\n');

    try {
        // Setup
        const { user, email, password } = await setupTestUser();

        // Test login
        const cookies = await testLogin(email, password);

        // Test invalid login
        await testInvalidLogin();

        // Test session check with valid cookie
        await testSessionCheck(cookies);

        // Test session check without cookie
        await testSessionCheckWithoutCookie();

        // Test logout
        await testLogout(cookies);

        // Test session check after logout
        await testSessionAfterLogout(cookies);

        // Cleanup
        await cleanup(user.id);

        console.log('\n✅ All authentication API tests passed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
