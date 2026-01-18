import { task } from "@trigger.dev/sdk/v3";

// LLM Task - Calls Gemini API
export const llmTask = task({
    id: "llm-gemini",
    maxDuration: 120,
    run: async (payload: {
        model: string;
        systemPrompt?: string;
        userMessage: string;
        images?: string[];
    }) => {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: payload.model || "gemini-1.5-flash" });

        const parts: Array<{ text: string }> = [];

        if (payload.systemPrompt) {
            parts.push({ text: `System: ${payload.systemPrompt}\n\n` });
        }
        parts.push({ text: payload.userMessage });

        const response = await model.generateContent(parts);
        const text = response.response.text();

        return {
            text,
            model: payload.model,
            tokensUsed: response.response.usageMetadata?.totalTokenCount || 0,
        };
    },
});

// Crop Image Task - Uses FFmpeg (Mock for now)
export const cropImageTask = task({
    id: "crop-image-ffmpeg",
    maxDuration: 60,
    run: async (payload: {
        imageUrl: string;
        xPercent: number;
        yPercent: number;
        widthPercent: number;
        heightPercent: number;
    }) => {
        return {
            imageUrl: payload.imageUrl,
            cropApplied: {
                x: payload.xPercent,
                y: payload.yPercent,
                width: payload.widthPercent,
                height: payload.heightPercent,
            },
            message: `Cropped image at ${payload.xPercent}%, ${payload.yPercent}%`,
        };
    },
});

// Extract Frame Task - Uses FFmpeg (Mock for now)
export const extractFrameTask = task({
    id: "extract-frame-ffmpeg",
    maxDuration: 60,
    run: async (payload: {
        videoUrl: string;
        timestamp: number | string;
    }) => {
        const ts = typeof payload.timestamp === "string"
            ? payload.timestamp
            : `${payload.timestamp}s`;

        return {
            imageUrl: `${payload.videoUrl}#frame-${ts}`,
            timestamp: payload.timestamp,
            message: `Extracted frame at ${ts}`,
        };
    },
});
