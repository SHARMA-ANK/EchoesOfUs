import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/families
 * Fetch all families owned by the authenticated user
 * Includes profiles and chapters in response
 */
export async function GET(req: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Fetch families where adminUserId = current user
        const families = await prisma.family.findMany({
            where: {
                adminUserId: user.id,
            },
            include: {
                profiles: {
                    include: {
                        chapters: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(families, { status: 200 });
    } catch (error) {
        console.error('Error fetching families:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/families
 * Create a new family for the authenticated user
 */
export async function POST(req: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { familyName } = body;

        // Validate familyName input
        if (!familyName || typeof familyName !== 'string' || familyName.trim().length === 0) {
            return NextResponse.json(
                { error: 'Family name is required' },
                { status: 400 }
            );
        }

        // Create Family with adminUserId = current user
        const family = await prisma.family.create({
            data: {
                adminUserId: user.id,
                familyName: familyName.trim(),
                isPublishedToGlobal: false, // Default to false
            },
            include: {
                profiles: {
                    include: {
                        chapters: true,
                    },
                },
            },
        });

        return NextResponse.json(family, { status: 201 });
    } catch (error) {
        console.error('Error creating family:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
