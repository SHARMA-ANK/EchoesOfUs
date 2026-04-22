import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireFamilyOwnership } from "@/lib/auth/middleware";
import { generateMagicLinkToken } from "@/lib/auth/magic-link";

// GET all profiles where family.adminUserId = current user
export async function GET(req: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch profiles where family.adminUserId = current user
        const profiles = await prisma.profile.findMany({
            where: {
                family: {
                    adminUserId: user.id,
                },
            },
            include: {
                family: true,
                chapters: {
                    orderBy: {
                        chapterNumber: "asc",
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(profiles);
    } catch (error) {
        console.error("Error fetching profiles:", error);
        return NextResponse.json(
            { error: "Failed to fetch profiles" },
            { status: 500 }
        );
    }
}

// POST create new profile
export async function POST(req: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { familyId, name, age, relation } = body;

        if (!familyId || !name || !age) {
            return NextResponse.json(
                { error: "familyId, name, and age are required" },
                { status: 400 }
            );
        }

        // Verify family ownership
        const hasOwnership = await requireFamilyOwnership(familyId, user.id);
        if (!hasOwnership) {
            return NextResponse.json(
                { error: "Forbidden: You do not own this family" },
                { status: 403 }
            );
        }

        // Generate cryptographically secure magic link token
        const magicLinkToken = generateMagicLinkToken();

        const profile = await prisma.profile.create({
            data: {
                familyId,
                name,
                age: parseInt(age),
                relation: relation || null,
                magicLinkToken,
            },
        });

        return NextResponse.json(profile, { status: 201 });
    } catch (error) {
        console.error("Error creating profile:", error);
        return NextResponse.json(
            { error: "Failed to create profile" },
            { status: 500 }
        );
    }
}
