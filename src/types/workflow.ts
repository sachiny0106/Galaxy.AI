import { Node, Edge } from "@xyflow/react";

// Node Data Types - using Record for React Flow compatibility
export interface TextNodeData extends Record<string, unknown> {
    label: string;
    text: string;
}

export interface UploadImageNodeData extends Record<string, unknown> {
    label: string;
    imageUrl: string | null;
    fileName: string | null;
}

export interface UploadVideoNodeData extends Record<string, unknown> {
    label: string;
    videoUrl: string | null;
    fileName: string | null;
}

export interface LlmNodeData extends Record<string, unknown> {
    label: string;
    model: string;
    systemPrompt: string;
    userMessage: string;
    images: string[];
    response: string | null;
    isLoading: boolean;
}

export interface CropImageNodeData extends Record<string, unknown> {
    label: string;
    imageUrl: string | null;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    outputUrl: string | null;
}

export interface ExtractFrameNodeData extends Record<string, unknown> {
    label: string;
    videoUrl: string | null;
    timestamp: number;
    outputUrl: string | null;
}

export type WorkflowNodeData =
    | TextNodeData
    | UploadImageNodeData
    | UploadVideoNodeData
    | LlmNodeData
    | CropImageNodeData
    | ExtractFrameNodeData;

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

// Node Types Enum
export const NodeType = {
    TEXT: "text",
    UPLOAD_IMAGE: "uploadImage",
    UPLOAD_VIDEO: "uploadVideo",
    LLM: "llm",
    CROP_IMAGE: "cropImage",
    EXTRACT_FRAME: "extractFrame",
} as const;

export type NodeTypeValue = typeof NodeType[keyof typeof NodeType];

// Handle Types for Type Safety
export const HandleType = {
    TEXT: "text",
    IMAGE_URL: "image_url",
    VIDEO_URL: "video_url",
} as const;

export type HandleTypeValue = typeof HandleType[keyof typeof HandleType];

// Handle Definitions per Node
export const NODE_HANDLE_TYPES: Record<NodeTypeValue, { inputs: HandleTypeValue[]; outputs: HandleTypeValue[] }> = {
    [NodeType.TEXT]: {
        inputs: [],
        outputs: [HandleType.TEXT],
    },
    [NodeType.UPLOAD_IMAGE]: {
        inputs: [],
        outputs: [HandleType.IMAGE_URL],
    },
    [NodeType.UPLOAD_VIDEO]: {
        inputs: [],
        outputs: [HandleType.VIDEO_URL],
    },
    [NodeType.LLM]: {
        inputs: [HandleType.TEXT, HandleType.TEXT, HandleType.IMAGE_URL],
        outputs: [HandleType.TEXT],
    },
    [NodeType.CROP_IMAGE]: {
        inputs: [HandleType.IMAGE_URL],
        outputs: [HandleType.IMAGE_URL],
    },
    [NodeType.EXTRACT_FRAME]: {
        inputs: [HandleType.VIDEO_URL],
        outputs: [HandleType.IMAGE_URL],
    },
};

// Workflow Run Status
export type RunStatus = "pending" | "running" | "success" | "failed";

export interface NodeExecution {
    id: string;
    nodeId: string;
    nodeType: string;
    status: RunStatus;
    inputs: Record<string, unknown> | null;
    outputs: Record<string, unknown> | null;
    error: string | null;
    duration: number | null;
}

export interface WorkflowRun {
    id: string;
    status: RunStatus;
    startedAt: Date;
    completedAt: Date | null;
    duration: number | null;
    scope: "full" | "single";
    nodeExecutions: NodeExecution[];
}

export interface Workflow {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    createdAt: Date;
    updatedAt: Date;
}
