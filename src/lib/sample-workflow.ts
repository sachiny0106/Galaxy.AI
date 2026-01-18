import { WorkflowNode, WorkflowEdge, NodeType } from "@/types/workflow";

export const SAMPLE_WORKFLOW: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
    nodes: [
        {
            id: "node-1",
            type: NodeType.UPLOAD_IMAGE,
            position: { x: 50, y: 50 },
            data: {
                label: "Upload Product Photo",
                imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
                fileName: "headphones.jpg"
            },
        },
        {
            id: "node-2",
            type: NodeType.UPLOAD_VIDEO,
            position: { x: 50, y: 300 },
            data: {
                label: "Upload Product Video",
                videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
                fileName: "demo.mp4"
            },
        },
        {
            id: "node-3",
            type: NodeType.CROP_IMAGE,
            position: { x: 400, y: 50 },
            data: {
                label: "Crop Product (80%)",
                xPercent: 10,
                yPercent: 10,
                widthPercent: 80,
                heightPercent: 80,
                imageUrl: null,
                outputUrl: null
            },
        },
        {
            id: "node-4",
            type: NodeType.TEXT,
            position: { x: 400, y: 200 },
            data: {
                label: "System Prompt (Copywriter)",
                text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description."
            },
        },
        {
            id: "node-5",
            type: NodeType.TEXT,
            position: { x: 400, y: 350 },
            data: {
                label: "Product Details",
                text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design."
            },
        },
        {
            id: "node-6",
            type: NodeType.EXTRACT_FRAME,
            position: { x: 400, y: 500 },
            data: {
                label: "Extract Frame (50%)",
                videoUrl: null,
                timestamp: 5, // Approximate 50% for short video
                outputUrl: null
            },
        },
        {
            id: "node-7",
            type: NodeType.LLM,
            position: { x: 800, y: 200 },
            data: {
                label: "LLM #1: Description",
                model: "gemini-2.0-flash",
                systemPrompt: "",
                userMessage: "",
                images: [],
                response: null,
                isLoading: false
            },
        },
        {
            id: "node-8",
            type: NodeType.TEXT,
            position: { x: 800, y: 400 },
            data: {
                label: "System Prompt (Social)",
                text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame."
            },
        },
        {
            id: "node-9",
            type: NodeType.LLM,
            position: { x: 1200, y: 300 },
            data: {
                label: "LLM #2: Final Tweet",
                model: "gemini-2.0-flash",
                systemPrompt: "",
                userMessage: "",
                images: [],
                response: null,
                isLoading: false
            },
        }
    ],
    edges: [
        // Branch A: Image -> Crop -> LLM 1
        {
            id: "e1-3",
            source: "node-1",
            target: "node-3",
            sourceHandle: "image_url-source",
            targetHandle: "image_url-0",
            type: "animated",
            animated: true
        },
        {
            id: "e3-7-img",
            source: "node-3",
            target: "node-7",
            sourceHandle: "image_url-0",
            targetHandle: "images-0",
            type: "animated",
            animated: true
        },
        {
            id: "e4-7-sys",
            source: "node-4",
            target: "node-7",
            sourceHandle: "output-source",
            targetHandle: "system_prompt-0",
            type: "animated",
            animated: true
        },
        {
            id: "e5-7-user",
            source: "node-5",
            target: "node-7",
            sourceHandle: "output-source",
            targetHandle: "user_message-0",
            type: "animated",
            animated: true
        },

        // Branch B: Video -> Extract
        {
            id: "e2-6",
            source: "node-2",
            target: "node-6",
            sourceHandle: "video_url-source",
            targetHandle: "video_url-0",
            type: "animated",
            animated: true
        },

        // Convergence: LLM 2
        {
            id: "e7-9-user",
            source: "node-7",
            target: "node-9",
            sourceHandle: "output-source",
            targetHandle: "user_message-0", // Feed description as user message content
            type: "animated",
            animated: true
        },
        {
            id: "e8-9-sys",
            source: "node-8",
            target: "node-9",
            sourceHandle: "output-source",
            targetHandle: "system_prompt-0",
            type: "animated",
            animated: true
        },
        {
            id: "e3-9-img",
            source: "node-3",
            target: "node-9",
            sourceHandle: "image_url-0",
            targetHandle: "images-0", // Cropped product image
            type: "animated",
            animated: true
        },
        {
            id: "e6-9-img",
            source: "node-6",
            target: "node-9",
            sourceHandle: "image_url-0",
            targetHandle: "images-0", // Extracted video frame
            type: "animated",
            animated: true
        }
    ]
};
