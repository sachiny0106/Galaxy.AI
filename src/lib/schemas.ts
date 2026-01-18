import { z } from "zod";

// LLM Request Schema
export const llmRequestSchema = z.object({
    model: z.string().default("gemini-1.5-flash"),
    systemPrompt: z.string().optional().default(""),
    userMessage: z.string().min(1, "User message is required"),
    images: z.array(z.string().url()).optional().default([]),
});

export type LlmRequest = z.infer<typeof llmRequestSchema>;

// Crop Image Request Schema
export const cropRequestSchema = z.object({
    imageUrl: z.string().url("Valid image URL required"),
    xPercent: z.number().min(0).max(100).default(0),
    yPercent: z.number().min(0).max(100).default(0),
    widthPercent: z.number().min(0).max(100).default(100),
    heightPercent: z.number().min(0).max(100).default(100),
});

export type CropRequest = z.infer<typeof cropRequestSchema>;

// Extract Frame Request Schema
export const extractFrameSchema = z.object({
    videoUrl: z.string().url(),
    timestamp: z.union([
        z.number().min(0),
        z.string().regex(/^\d+%?$/, "Timestamp must be number or percentage like '50%'"),
    ]).default(0),
});

export type ExtractFrameRequest = z.infer<typeof extractFrameSchema>;

// Workflow Schema
export const workflowNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    data: z.record(z.string(), z.unknown()),
});

export const workflowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    type: z.string().optional(),
});

export const workflowSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Workflow name required"),
    nodes: z.array(workflowNodeSchema),
    edges: z.array(workflowEdgeSchema),
});

export type WorkflowExport = z.infer<typeof workflowSchema>;

// Run Workflow Request Schema
export const runWorkflowSchema = z.object({
    workflowId: z.string().optional(),
    nodes: z.array(workflowNodeSchema),
    edges: z.array(workflowEdgeSchema),
    scope: z.enum(["full", "single", "selected"]).default("full"),
    selectedNodeIds: z.array(z.string()).optional(),
});

export type RunWorkflowRequest = z.infer<typeof runWorkflowSchema>;
