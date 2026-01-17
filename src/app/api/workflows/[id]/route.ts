import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/workflows/[id] - Get a specific workflow
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const workflow = await prisma.workflow.findFirst({
            where: { id, userId: user.id },
            include: {
                runs: {
                    orderBy: { startedAt: "desc" },
                    take: 10,
                    include: {
                        nodeExecutions: true,
                    },
                },
            },
        });

        if (!workflow) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        return NextResponse.json({ workflow });
    } catch (error) {
        console.error("Failed to fetch workflow:", error);
        return NextResponse.json(
            { error: "Failed to fetch workflow" },
            { status: 500 }
        );
    }
}

// PUT /api/workflows/[id] - Update a workflow
export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, nodes, edges } = body;

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const workflow = await prisma.workflow.updateMany({
            where: { id, userId: user.id },
            data: {
                ...(name && { name }),
                ...(nodes && { nodes: JSON.parse(JSON.stringify(nodes)) }),
                ...(edges && { edges: JSON.parse(JSON.stringify(edges)) }),
            },
        });

        if (workflow.count === 0) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update workflow:", error);
        return NextResponse.json(
            { error: "Failed to update workflow" },
            { status: 500 }
        );
    }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const workflow = await prisma.workflow.deleteMany({
            where: { id, userId: user.id },
        });

        if (workflow.count === 0) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete workflow:", error);
        return NextResponse.json(
            { error: "Failed to delete workflow" },
            { status: 500 }
        );
    }
}
