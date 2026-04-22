import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { setSessionCookie } from '@/lib/auth/cookies';

/**
 * Email validation regex (basic format check)
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Password strength validation (minimum 8 characters)
 */
function isValidPassword(password: string): boolean {
    return password.length >= 8;
}

/**
 * POST /api/auth/register
 * Register a new user with email and password
 * Creates a default Family record for the user
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, familyName } = body;

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (!isValidPassword(password)) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user and default family in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                },
            });

            // Create default family
            const family = await tx.family.create({
                data: {
                    adminUserId: user.id,
                    familyName: familyName || 'My Family Archive',
                    isPublishedToGlobal: false,
                },
            });

            return { user, family };
        });

        // Create session
        const session = await createSession(result.user.id);

        // Set session cookie
        const response = NextResponse.json(
            {
                userId: result.user.id,
                familyId: result.family.id,
            },
            { status: 201 }
        );

        setSessionCookie(response, session.token);

        return response;
    } catch (error) {
        console.error('Error during registration:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
