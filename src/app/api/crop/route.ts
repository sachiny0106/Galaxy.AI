import { NextResponse } from "next/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { cropRequestSchema } from "@/lib/schemas";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate with Zod
        const result = cropRequestSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { imageUrl, xPercent, yPercent, widthPercent, heightPercent } = result.data;

        // Trigger the Crop Image task
        const handle = await tasks.trigger("crop-image-ffmpeg", {
            imageUrl,
            xPercent,
            yPercent,
            widthPercent,
            heightPercent,
        });

        // Short-polling loop to return result synchronously
        const MAX_RETRIES = 15;
        const DELAY = 400;

        for (let i = 0; i < MAX_RETRIES; i++) {
            const run = await runs.retrieve(handle.id);
            if (run.status === "COMPLETED" && run.output) {
                return NextResponse.json(run.output);
            }
            if (run.status === "FAILED") {
                throw new Error(run.error?.message || "Task failed");
            }
            await new Promise(r => setTimeout(r, DELAY));
        }

        return NextResponse.json({
            imageUrl,
            message: "Request queued (Trigger.dev). Check history for results."
        });
    } catch (error) {
        console.error("Crop API error:", error);
        return NextResponse.json(
            { error: "Failed to crop image" },
            { status: 500 }
        );
    }
}
