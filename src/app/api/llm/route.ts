import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

        // Direct Gemini API call (bypasses Trigger.dev for immediate response)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const geminiModel = genAI.getGenerativeModel({ model: model || "gemini-2.0-flash" });

        const parts: Array<{ text: string }> = [];
        if (systemPrompt) {
            parts.push({ text: `System: ${systemPrompt}\n\n` });
        }
        parts.push({ text: userMessage });

        const response = await geminiModel.generateContent(parts);
        const text = response.response.text();

        return NextResponse.json({
            text,
            model: model || "gemini-2.0-flash",
            tokensUsed: response.response.usageMetadata?.totalTokenCount || 0
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
