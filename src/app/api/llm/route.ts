import { NextResponse } from "next/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
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

        // Trigger the LLM task
        const handle = await tasks.trigger("llm-gemini", {
            model: model || "gemini-2.0-flash", // Update to Gemini 2.0
            systemPrompt,
            userMessage,
            images,
        });

        // For the prototype/hackathon context, we'll poll for the result briefly
        // In a full production app, we'd use webhooks or SWR to poll the run status
        // But here we need to block briefly to return the result to the UI for the "Run" button

        // NOTE: This is a simplification for the synchronous UI expectation. 
        // Real implementation would return `handle.id` and UI would poll.
        // We will mock the immediate response for now or wait for it if possible.
        // Since tasks.trigger is async/background, we can't easily wait without polling.

        // HOWEVER, to strictly meet the requirement "All LLM calls MUST run as Trigger.dev tasks",
        // we MUST use `tasks.trigger`. 

        // To keep the UI working without a massive refactor of the frontend execution engine (polling),
        // we will implement a short-polling loop here in the API route.

        // Wait for up to 10 seconds for the task to complete
        const MAX_RETRIES = 20;
        const DELAY = 500;

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

        // If it times out, return the valid handle so the UI doesn't crash, 
        // even if it can't show the text yet.
        return NextResponse.json({
            text: "Request queued in background (Trigger.dev). Please check history later.",
            model,
            tokensUsed: 0
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
