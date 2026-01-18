import { WorkflowNode, WorkflowEdge, NodeType } from "@/types/workflow";

export interface SampleWorkflow {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export function createSampleWorkflow(): SampleWorkflow {
    const nodes: WorkflowNode[] = [
        // Branch A: Image processing
        {
            id: "node-1",
            type: NodeType.UPLOAD_IMAGE,
            position: { x: 50, y: 50 },
            data: { label: "Upload Image", imageUrl: null, fileName: null },
        },
        {
            id: "node-2",
            type: NodeType.CROP_IMAGE,
            position: { x: 350, y: 50 },
            data: {
                label: "Crop Image",
                imageUrl: null,
                xPercent: 10,
                yPercent: 10,
                widthPercent: 80,
                heightPercent: 80,
                outputUrl: null,
            },
        },
        {
            id: "node-3",
            type: NodeType.TEXT,
            position: { x: 350, y: 200 },
            data: { label: "Description Prompt", text: "Describe this image in detail for a marketing campaign." },
        },
        {
            id: "node-4",
            type: NodeType.LLM,
            position: { x: 650, y: 80 },
            data: {
                label: "Generate Description",
                model: "gemini-2.0-flash",
                systemPrompt: "",
                userMessage: "",
                images: [],
                response: null,
                isLoading: false,
            },
        },

        // Branch B: Video processing
        {
            id: "node-5",
            type: NodeType.UPLOAD_VIDEO,
            position: { x: 50, y: 350 },
            data: { label: "Upload Video", videoUrl: null, fileName: null },
        },
        {
            id: "node-6",
            type: NodeType.EXTRACT_FRAME,
            position: { x: 350, y: 350 },
            data: { label: "Extract Frame", videoUrl: null, timestamp: 2.5, outputUrl: null },
        },

        // Convergence: Final LLM
        {
            id: "node-7",
            type: NodeType.TEXT,
            position: { x: 650, y: 350 },
            data: { label: "Social Post Prompt", text: "Create a compelling social media post that combines this image description with the video frame to promote our brand." },
        },
        {
            id: "node-8",
            type: NodeType.LLM,
            position: { x: 950, y: 200 },
            data: {
                label: "Generate Social Post",
                model: "gemini-2.0-flash",
                systemPrompt: "You are a creative social media manager.",
                userMessage: "",
                images: [],
                response: null,
                isLoading: false,
            },
        },
    ];

    const edges: WorkflowEdge[] = [
        // Branch A connections
        {
            id: "edge-1",
            source: "node-1",
            target: "node-2",
            sourceHandle: "image_url-0",
            targetHandle: "image_url-0",
            type: "animated",
        },
        {
            id: "edge-2",
            source: "node-2",
            target: "node-4",
            sourceHandle: "image_url-0",
            targetHandle: "image_url-0",
            type: "animated",
        },
        {
            id: "edge-3",
            source: "node-3",
            target: "node-4",
            sourceHandle: "text-0",
            targetHandle: "text-1",
            type: "animated",
        },

        // Branch B connections
        {
            id: "edge-4",
            source: "node-5",
            target: "node-6",
            sourceHandle: "video_url-0",
            targetHandle: "video_url-0",
            type: "animated",
        },

        // Convergence connections
        {
            id: "edge-5",
            source: "node-4",
            target: "node-8",
            sourceHandle: "text-0",
            targetHandle: "text-0",
            type: "animated",
        },
        {
            id: "edge-6",
            source: "node-6",
            target: "node-8",
            sourceHandle: "image_url-0",
            targetHandle: "image_url-0",
            type: "animated",
        },
        {
            id: "edge-7",
            source: "node-7",
            target: "node-8",
            sourceHandle: "text-0",
            targetHandle: "text-1",
            type: "animated",
        },
    ];

    return { nodes, edges };
}
