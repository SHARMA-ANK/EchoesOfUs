import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireFamilyOwnership } from '@/lib/auth/middleware';

/**
 * PATCH /api/families/[id]
 * Update a family's name and/or publish status
 * Requires authentication and family ownership
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Verify family ownership
        const isOwner = await requireFamilyOwnership(id, user.id);
        if (!isOwner) {
            // Check if family exists to distinguish 403 from 404
            const familyExists = await prisma.family.findUnique({
                where: { id },
                select: { id: true },
            });

            if (!familyExists) {
                return NextResponse.json(
                    { error: 'Family not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: 'Forbidden: You do not own this family' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { familyName, isPublishedToGlobal } = body;

        // Build update data object
        const updateData: {
            familyName?: string;
            isPublishedToGlobal?: boolean;
        } = {};

        if (familyName !== undefined) {
            if (typeof familyName !== 'string' || familyName.trim().length === 0) {
                return NextResponse.json(
                    { error: 'Family name must be a non-empty string' },
                    { status: 400 }
                );
            }
            updateData.familyName = familyName.trim();
        }

        if (isPublishedToGlobal !== undefined) {
            if (typeof isPublishedToGlobal !== 'boolean') {
                return NextResponse.json(
                    { error: 'isPublishedToGlobal must be a boolean' },
                    { status: 400 }
                );
            }
            updateData.isPublishedToGlobal = isPublishedToGlobal;
        }

        // Ensure at least one field is being updated
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Update family
        const family = await prisma.family.update({
            where: { id },
            data: updateData,
            include: {
                profiles: {
                    include: {
                        chapters: true,
                    },
                },
            },
        });

        return NextResponse.json(family, { status: 200 });
    } catch (error) {
        console.error('Error updating family:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/families/[id]
 * Delete a family and cascade to profiles and chapters
 * Requires authentication and family ownership
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Verify family ownership
        const isOwner = await requireFamilyOwnership(id, user.id);
        if (!isOwner) {
            // Check if family exists to distinguish 403 from 404
            const familyExists = await prisma.family.findUnique({
                where: { id },
                select: { id: true },
            });

            if (!familyExists) {
                return NextResponse.json(
                    { error: 'Family not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: 'Forbidden: You do not own this family' },
                { status: 403 }
            );
        }

        // Delete family (cascade to profiles and chapters via Prisma schema)
        await prisma.family.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting family:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
