import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { llmRequestSchema } from "@/lib/schemas";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        // Get the model
        const geminiModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });

        // Build the prompt
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        // Add system prompt if provided
        if (systemPrompt) {
            parts.push({ text: `System: ${systemPrompt}\n\n` });
        }

        // Add user message
        parts.push({ text: userMessage });

        // Add images if provided (base64 or URLs converted to base64)
        if (images && images.length > 0) {
            for (const imageUrl of images) {
                try {
                    // For now, skip image processing - would need to fetch and convert to base64
                    // In production, handle image URLs properly
                    parts.push({ text: `[Image attached: ${imageUrl}]` });
                } catch (e) {
                    console.warn("Failed to process image:", e);
                }
            }
        }

        // Generate content
        const response = await geminiModel.generateContent(parts);
        const text = response.response.text();

        return NextResponse.json({
            text,
            model: model || "gemini-1.5-flash",
            tokensUsed: response.response.usageMetadata?.totalTokenCount || 0,
        });
    } catch (error) {
        console.error("LLM API error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: `Failed to process LLM request: ${errorMessage}` },
            { status: 500 }
        );
    }
}
