import { create } from "zustand";
import {
    WorkflowNode,
    WorkflowEdge,
    WorkflowNodeData,
    NodeType,
    NodeTypeValue,
    HandleTypeValue,
    NODE_HANDLE_TYPES,
} from "@/types/workflow";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    Connection,
    NodeChange,
    EdgeChange,
} from "@xyflow/react";

interface WorkflowState {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    selectedNodeId: string | null;
    executingNodes: Set<string>;
    isExecuting: boolean;

    setNodes: (nodes: WorkflowNode[]) => void;
    setEdges: (edges: WorkflowEdge[]) => void;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => boolean;
    addNode: (type: NodeTypeValue, position: { x: number; y: number }) => void;
    updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
    deleteNode: (nodeId: string) => void;
    selectNode: (nodeId: string | null) => void;
    setExecuting: (isExecuting: boolean) => void;
    setNodeExecuting: (nodeId: string, executing: boolean) => void;
    getConnectedInputs: (nodeId: string) => Map<string, string>;
    validateConnection: (source: string, target: string, sourceHandle: string, targetHandle: string) => boolean;
    reset: () => void;
}

const DEFAULT_NODE_DATA: Record<NodeTypeValue, () => WorkflowNodeData> = {
    [NodeType.TEXT]: () => ({ label: "Text", text: "" }),
    [NodeType.UPLOAD_IMAGE]: () => ({ label: "Upload Image", imageUrl: null, fileName: null }),
    [NodeType.UPLOAD_VIDEO]: () => ({ label: "Upload Video", videoUrl: null, fileName: null }),
    [NodeType.LLM]: () => ({
        label: "Run LLM",
        model: "gemini-2.0-flash",
        systemPrompt: "You are a helpful and intelligent AI assistant. Your goal is to provide clear, concise, and accurate responses based on the user's input and context.",
        userMessage: "",
        images: [],
        response: null,
        isLoading: false,
    }),
    [NodeType.CROP_IMAGE]: () => ({
        label: "Crop Image",
        imageUrl: null,
        xPercent: 0,
        yPercent: 0,
        widthPercent: 100,
        heightPercent: 100,
        outputUrl: null,
    }),
    [NodeType.EXTRACT_FRAME]: () => ({
        label: "Extract Frame",
        videoUrl: null,
        timestamp: 0,
        outputUrl: null,
    }),
};

let nodeIdCounter = 100;

import { temporal } from "zundo";

export const useWorkflowStore = create<WorkflowState>()(
    temporal(
        (set, get) => ({
            nodes: [],
            edges: [],
            selectedNodeId: null,
            executingNodes: new Set(),
            isExecuting: false,

            setNodes: (nodes) => {
                // simple max id check
                const maxId = nodes.reduce((max, n) => {
                    const id = parseInt(n.id.replace("node-", "") || "0");
                    return Math.max(max, id);
                }, 0);

                if (maxId >= nodeIdCounter) nodeIdCounter = maxId + 1;
                set({ nodes });
            },
            setEdges: (edges) => set({ edges }),

            onNodesChange: (changes) => {
                set({ nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[] });
            },

            onEdgesChange: (changes) => {
                set({ edges: applyEdgeChanges(changes, get().edges) });
            },

            onConnect: (connection) => {
                const { source, target, sourceHandle, targetHandle } = connection;
                if (!source || !target || !sourceHandle || !targetHandle) return false;

                if (!get().validateConnection(source, target, sourceHandle, targetHandle)) {
                    return false;
                }

                if (wouldCreateCycle(get().nodes, get().edges, source, target)) {
                    return false;
                }

                set({ edges: addEdge(connection, get().edges) });
                return true;
            },

            addNode: (type, position) => {
                const id = `node-${nodeIdCounter++}`;
                const data = (DEFAULT_NODE_DATA[type] ? DEFAULT_NODE_DATA[type]() : { label: "Unknown", text: "" }) as WorkflowNodeData;

                set({
                    nodes: [...get().nodes, { id, type, position, data }]
                });
            },

            updateNodeData: (nodeId, data) => {
                set({
                    nodes: get().nodes.map((node) =>
                        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
                    ),
                });
            },

            deleteNode: (nodeId) => {
                set({
                    nodes: get().nodes.filter((n) => n.id !== nodeId),
                    edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
                    selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
                });
            },

            selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

            setExecuting: (isExecuting) => set({ isExecuting }),

            setNodeExecuting: (nodeId, executing) => {
                const newSet = new Set(get().executingNodes);
                if (executing) {
                    newSet.add(nodeId);
                } else {
                    newSet.delete(nodeId);
                }
                set({ executingNodes: newSet });
            },

            getConnectedInputs: (nodeId) => {
                const connected = new Map<string, string>();
                get().edges.forEach((edge) => {
                    if (edge.target === nodeId && edge.targetHandle) {
                        connected.set(edge.targetHandle, edge.source);
                    }
                });
                return connected;
            },

            validateConnection: (source, target, sourceHandle, targetHandle) => {
                const sourceNode = get().nodes.find((n) => n.id === source);
                const targetNode = get().nodes.find((n) => n.id === target);
                if (!sourceNode || !targetNode) return false;

                const sourceType = sourceNode.type as NodeTypeValue;
                const targetType = targetNode.type as NodeTypeValue;

                const sourceHandleType = getHandleType(sourceType, sourceHandle, "output");
                const targetHandleType = getHandleType(targetType, targetHandle, "input");

                if (!sourceHandleType || !targetHandleType) return false;

                return sourceHandleType === targetHandleType;
            },

            reset: () => {
                set({
                    nodes: [],
                    edges: [],
                    selectedNodeId: null,
                    executingNodes: new Set(),
                    isExecuting: false,
                });
                nodeIdCounter = 1;
            },
        }),
        {
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
            }),
        }
    )
);

function getHandleType(nodeType: NodeTypeValue, handleId: string, direction: "input" | "output"): HandleTypeValue | null {
    const config = NODE_HANDLE_TYPES[nodeType];
    if (!config) return null;
    const handles = direction === "input" ? config.inputs : config.outputs;

    const parts = handleId.split("-");
    const typeName = parts.slice(0, -1).join("-") as HandleTypeValue;

    if (handles.includes(typeName)) {
        return typeName;
    }
    return null;
}

function wouldCreateCycle(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    newSource: string,
    newTarget: string
): boolean {
    const adj = new Map<string, string[]>();
    nodes.forEach((n) => adj.set(n.id, []));

    edges.forEach((e) => {
        const list = adj.get(e.source) || [];
        list.push(e.target);
        adj.set(e.source, list);
    });

    const sourceList = adj.get(newSource) || [];
    sourceList.push(newTarget);
    adj.set(newSource, sourceList);

    const visited = new Set<string>();
    const recStack = new Set<string>();

    function dfs(node: string): boolean {
        visited.add(node);
        recStack.add(node);

        const neighbors = adj.get(node) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor)) return true;
            } else if (recStack.has(neighbor)) {
                return true;
            }
        }

        recStack.delete(node);
        return false;
    }

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            if (dfs(node.id)) return true;
        }
    }

    return false;
}
