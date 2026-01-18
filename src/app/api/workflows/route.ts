import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { workflowSchema } from "@/lib/schemas";

// GET /api/workflows - List all workflows for the current user
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get or create user
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            // Create user if doesn't exist
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: `${userId}@clerk.user`,
                },
            });
        }

        const workflows = await prisma.workflow.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ workflows });
    } catch (error) {
        console.error("Failed to fetch workflows:", error);
        return NextResponse.json(
            { error: "Failed to fetch workflows" },
            { status: 500 }
        );
    }
}

// POST /api/workflows - Create a new workflow
export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validate with Zod
        const result = workflowSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { name, nodes, edges } = result.data;

        // Get or create user
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: `${userId}@clerk.user`,
                },
            });
        }

        const workflow = await prisma.workflow.create({
            data: {
                name,
                nodes: JSON.parse(JSON.stringify(nodes)),
                edges: JSON.parse(JSON.stringify(edges)),
                userId: user.id,
            },
        });

        return NextResponse.json({ workflow }, { status: 201 });
    } catch (error) {
        console.error("Failed to create workflow:", error);
        return NextResponse.json(
            { error: "Failed to create workflow" },
            { status: 500 }
        );
    }
}
