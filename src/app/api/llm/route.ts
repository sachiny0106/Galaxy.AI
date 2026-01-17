import { NextResponse } from "next/server";
import { z } from "zod";
import { llmRequestSchema } from "@/lib/schemas";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate with Zod
        const result = llmRequestSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { model, systemPrompt, userMessage, images } = result.data;

        // TODO: In production, call Gemini API via Trigger.dev
        // For now, return mock response
        const mockResponse = `**LLM Response (${model})**\n\n${systemPrompt ? `System: ${systemPrompt}\n\n` : ""}Prompt: ${userMessage}\n\n${images.length > 0 ? `Analyzed ${images.length} image(s).\n\n` : ""}This is a simulated response. Connect your Gemini API key to get real AI responses.`;

        // Simulate API delay
        await new Promise((r) => setTimeout(r, 1500));

        return NextResponse.json({
            text: mockResponse,
            model,
            tokensUsed: Math.floor(Math.random() * 500) + 100,
        });
    } catch (error) {
        console.error("LLM API error:", error);
        return NextResponse.json(
            { error: "Failed to process LLM request" },
            { status: 500 }
        );
    }
}
