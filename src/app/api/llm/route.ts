import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { model, systemPrompt, userMessage, images } = body;

        // For demo purposes, return a mock response
        // In production, connect to Google Gemini API via Trigger.dev

        const mockResponse = `This is a simulated LLM response for model: ${model}.\n\nSystem: ${systemPrompt || "None"}\nUser: ${userMessage}\nImages: ${images?.length || 0} attached.\n\nIn production, this would call the Gemini API.`;

        // Simulate API delay
        await new Promise((r) => setTimeout(r, 1000));

        return NextResponse.json({ text: mockResponse });
    } catch (error) {
        console.error("LLM API error:", error);
        return NextResponse.json(
            { error: "Failed to process LLM request" },
            { status: 500 }
        );
    }
}
