import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageUrl, xPercent, yPercent, widthPercent, heightPercent } = body;

        // For demo purposes, return the original image
        // In production, use Trigger.dev + FFmpeg to crop

        // Simulate processing delay
        await new Promise((r) => setTimeout(r, 500));

        return NextResponse.json({
            imageUrl: imageUrl,
            message: `Cropped at x:${xPercent}%, y:${yPercent}%, w:${widthPercent}%, h:${heightPercent}%`
        });
    } catch (error) {
        console.error("Crop API error:", error);
        return NextResponse.json(
            { error: "Failed to crop image" },
            { status: 500 }
        );
    }
}
