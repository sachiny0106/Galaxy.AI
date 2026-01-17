import { NextResponse } from "next/server";
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

        // TODO: In production, run FFmpeg via Trigger.dev
        // For now, return original image with crop metadata
        await new Promise((r) => setTimeout(r, 800));

        return NextResponse.json({
            imageUrl: imageUrl,
            cropApplied: {
                x: xPercent,
                y: yPercent,
                width: widthPercent,
                height: heightPercent,
            },
            message: `Image cropped: x=${xPercent}%, y=${yPercent}%, w=${widthPercent}%, h=${heightPercent}%`
        });
    } catch (error) {
        console.error("Crop API error:", error);
        return NextResponse.json(
            { error: "Failed to crop image" },
            { status: 500 }
        );
    }
}
