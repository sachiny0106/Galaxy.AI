import { WorkflowNode, WorkflowEdge, NodeType } from "@/types/workflow";

export const SAMPLE_WORKFLOW: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
    nodes: [
        {
            id: "upload-image", type: NodeType.UPLOAD_IMAGE, position: { x: 50, y: 100 },
            data: { label: "Upload Image", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", fileName: "headphones.jpg" }
        },
        {
            id: "crop-image", type: NodeType.CROP_IMAGE, position: { x: 350, y: 100 },
            data: { label: "Crop Image", imageUrl: null, xPercent: 10, yPercent: 10, widthPercent: 80, heightPercent: 80, outputUrl: null }
        },
        {
            id: "text-system", type: NodeType.TEXT, position: { x: 350, y: 320 },
            data: { label: "System Prompt", text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description." }
        },
        {
            id: "text-details", type: NodeType.TEXT, position: { x: 350, y: 500 },
            data: { label: "Product Details", text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design." }
        },
        {
            id: "llm-1", type: NodeType.LLM, position: { x: 700, y: 280 },
            data: { label: "LLM #1", model: "gemini-2.0-flash", systemPrompt: "", userMessage: "", images: [], response: null, isLoading: false }
        },
        {
            id: "upload-video", type: NodeType.UPLOAD_VIDEO, position: { x: 50, y: 550 },
            data: { label: "Upload Video", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", fileName: "demo.mp4" }
        },
        {
            id: "extract-frame", type: NodeType.EXTRACT_FRAME, position: { x: 350, y: 680 },
            data: { label: "Extract Frame", videoUrl: null, timestamp: 50, outputUrl: null }
        },
        {
            id: "text-social", type: NodeType.TEXT, position: { x: 700, y: 580 },
            data: { label: "Social Prompt", text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame." }
        },
        {
            id: "llm-2", type: NodeType.LLM, position: { x: 1050, y: 400 },
            data: { label: "LLM #2 (Final)", model: "gemini-2.0-flash", systemPrompt: "", userMessage: "", images: [], response: null, isLoading: false }
        },
    ],
    edges: [
        { id: "e1", source: "upload-image", target: "crop-image", sourceHandle: "image_url-0", targetHandle: "image_url-0", type: "animated", animated: true },
        { id: "e2", source: "crop-image", target: "llm-1", sourceHandle: "image_url-0", targetHandle: "image_url-0", type: "animated", animated: true },
        { id: "e3", source: "text-system", target: "llm-1", sourceHandle: "text-0", targetHandle: "systemPrompt-0", type: "animated", animated: true },
        { id: "e4", source: "text-details", target: "llm-1", sourceHandle: "text-0", targetHandle: "userMessage-0", type: "animated", animated: true },
        { id: "e5", source: "upload-video", target: "extract-frame", sourceHandle: "video_url-source", targetHandle: "video_url-0", type: "animated", animated: true },
        { id: "e6", source: "text-social", target: "llm-2", sourceHandle: "text-0", targetHandle: "systemPrompt-0", type: "animated", animated: true },
        { id: "e7", source: "llm-1", target: "llm-2", sourceHandle: "text-0", targetHandle: "userMessage-0", type: "animated", animated: true },
        { id: "e8", source: "crop-image", target: "llm-2", sourceHandle: "image_url-0", targetHandle: "image_url-0", type: "animated", animated: true },
        { id: "e9", source: "extract-frame", target: "llm-2", sourceHandle: "image_url-0", targetHandle: "image_url-0", type: "animated", animated: true },
    ]
};
