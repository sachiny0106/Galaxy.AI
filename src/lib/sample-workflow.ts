import { WorkflowNode, WorkflowEdge, NodeType } from "@/types/workflow";

export const SAMPLE_WORKFLOW: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
    nodes: [
        // --- Branch A: Image Processing ---
        {
            id: "node-1",
            type: NodeType.UPLOAD_IMAGE,
            position: { x: 50, y: 50 },
            data: {
                label: "Product Photo",
                fileName: "headphones.jpg",
                imageUrl: "https://assets.transloadit.com/assets/images/compression/header.jpg" // Placeholder
            },
        },
        {
            id: "node-2",
            type: NodeType.CROP_IMAGE,
            position: { x: 50, y: 250 },
            data: {
                label: "Center Crop",
                xPercent: 10,
                yPercent: 10,
                widthPercent: 80,
                heightPercent: 80,
                imageUrl: ""
            },
        },
        {
            id: "node-3",
            type: NodeType.TEXT,
            position: { x: 300, y: 50 },
            data: {
                label: "Copywriter Persona",
                text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description."
            },
        },
        {
            id: "node-4",
            type: NodeType.TEXT,
            position: { x: 300, y: 180 },
            data: {
                label: "Product Details",
                text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design."
            },
        },
        {
            id: "node-5",
            type: NodeType.LLM,
            position: { x: 300, y: 350 },
            data: {
                label: "Generate Description",
                model: "gemini-2.0-flash",
                systemPrompt: "",
                userMessage: "",
                images: []
            },
        },

        // --- Branch B: Video Processing ---
        {
            id: "node-6",
            type: NodeType.UPLOAD_VIDEO,
            position: { x: 600, y: 50 },
            data: {
                label: "Demo Video",
                fileName: "demo.mp4",
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Placeholder
            },
        },
        {
            id: "node-7",
            type: NodeType.EXTRACT_FRAME,
            position: { x: 600, y: 250 },
            data: {
                label: "Extract Hero Frame",
                timestamp: 5,
                videoUrl: ""
            },
        },

        // --- Convergence ---
        {
            id: "node-8",
            type: NodeType.TEXT,
            position: { x: 500, y: 450 },
            data: {
                label: "Social Manager Persona",
                text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame."
            },
        },
        {
            id: "node-9",
            type: NodeType.LLM,
            position: { x: 450, y: 600 },
            data: {
                label: "Final Tweet Generator",
                model: "gemini-2.0-flash",
                systemPrompt: "",
                userMessage: "",
                images: []
            },
        },
    ],
    edges: [
        // Branch A Connections
        { id: "e1-2", source: "node-1", target: "node-2", sourceHandle: "image_url-0", targetHandle: "image_url-0" },
        { id: "e2-5-img", source: "node-2", target: "node-5", sourceHandle: "output-0", targetHandle: "image_url-0" },
        { id: "e3-5-sys", source: "node-3", target: "node-5", sourceHandle: "text-0", targetHandle: "text-0" }, // System
        { id: "e4-5-usr", source: "node-4", target: "node-5", sourceHandle: "text-0", targetHandle: "text-1" }, // User

        // Branch B Connections
        { id: "e6-7", source: "node-6", target: "node-7", sourceHandle: "video_url-0", targetHandle: "video_url-0" },

        // Convergence Connections
        { id: "e8-9-sys", source: "node-8", target: "node-9", sourceHandle: "text-0", targetHandle: "text-0" }, // System
        { id: "e5-9-usr", source: "node-5", target: "node-9", sourceHandle: "text-0", targetHandle: "text-1" }, // User (from LLM 1)
        { id: "e2-9-img", source: "node-2", target: "node-9", sourceHandle: "output-0", targetHandle: "image_url-0" }, // Image 1 (Crop)
        { id: "e7-9-img", source: "node-7", target: "node-9", sourceHandle: "output-0", targetHandle: "image_url-0" }, // Image 2 (Frame)
    ],
};
