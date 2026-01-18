import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
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

        // Trigger the Extract Frame task
        const handle = await tasks.trigger("extract-frame-ffmpeg", {
            videoUrl,
            timestamp,
        });

        // Short-polling loop to return result synchronously
        const MAX_RETRIES = 15;
        const DELAY = 400;

        for (let i = 0; i < MAX_RETRIES; i++) {
            const run = await tasks.retrieve(handle.id);
            if (run.status === "COMPLETED" && run.output) {
                return NextResponse.json(run.output);
            }
            if (run.status === "FAILED") {
                throw new Error(run.error?.message || "Task failed");
            }
            await new Promise(r => setTimeout(r, DELAY));
        }

        return NextResponse.json({
            imageUrl: videoUrl,
            timestamp,
            message: "Request queued (Trigger.dev). Check history for results."
        });
    } catch (error) {
        console.error("Extract frame API error:", error);
        return NextResponse.json(
            { error: "Failed to extract frame" },
            { status: 500 }
        );
    }
}
