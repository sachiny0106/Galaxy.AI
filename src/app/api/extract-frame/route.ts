import { NextResponse } from "next/server";
import { extractFrameSchema } from "@/lib/schemas";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate with Zod
        const result = extractFrameSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { videoUrl, timestamp } = result.data;

        // TODO: In production, run FFmpeg via Trigger.dev
        // For now, return placeholder
        await new Promise((r) => setTimeout(r, 800));

        return NextResponse.json({
            imageUrl: videoUrl, // In real impl, this would be the extracted frame
            timestamp: timestamp,
            message: `Frame extracted at ${timestamp}${typeof timestamp === 'string' && timestamp.includes('%') ? '' : 's'}`
        });
    } catch (error) {
        console.error("Extract frame API error:", error);
        return NextResponse.json(
            { error: "Failed to extract frame" },
            { status: 500 }
        );
    }
}
