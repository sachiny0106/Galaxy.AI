import { WorkflowNode, WorkflowEdge, NodeType, NodeTypeValue } from "@/types/workflow";

export interface ExecutionContext {
    nodeOutputs: Map<string, Record<string, unknown>>;
    onNodeStart: (nodeId: string) => void;
    onNodeComplete: (nodeId: string, outputs: Record<string, unknown>) => void;
    onNodeError: (nodeId: string, error: string) => void;
}

// Topological sort using Kahn's algorithm
export function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    nodes.forEach((n) => {
        inDegree.set(n.id, 0);
        adj.set(n.id, []);
    });

    edges.forEach((e) => {
        adj.get(e.source)?.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    const queue: string[] = [];
    nodes.forEach((n) => {
        if (inDegree.get(n.id) === 0) queue.push(n.id);
    });

    const sorted: string[] = [];
    while (queue.length > 0) {
        const node = queue.shift()!;
        sorted.push(node);
        adj.get(node)?.forEach((neighbor) => {
            inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
            if (inDegree.get(neighbor) === 0) queue.push(neighbor);
        });
    }

    return sorted;
}

// Get execution levels (groups of nodes that can run in parallel)
export function getExecutionLevels(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    nodes.forEach((n) => {
        inDegree.set(n.id, 0);
        adj.set(n.id, []);
    });

    edges.forEach((e) => {
        adj.get(e.source)?.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    const levels: string[][] = [];
    let currentLevel = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);

    while (currentLevel.length > 0) {
        levels.push(currentLevel);
        const nextLevel: string[] = [];
        currentLevel.forEach((nodeId) => {
            adj.get(nodeId)?.forEach((neighbor) => {
                inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
                if (inDegree.get(neighbor) === 0) nextLevel.push(neighbor);
            });
        });
        currentLevel = nextLevel;
    }

    return levels;
}

// Get inputs for a node from connected nodes outputs
export function resolveNodeInputs(
    nodeId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    nodeOutputs: Map<string, Record<string, unknown>>
): Record<string, unknown> {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return {};

    const inputs: Record<string, unknown> = { ...(node.data as Record<string, unknown>) };

    edges
        .filter((e) => e.target === nodeId)
        .forEach((edge) => {
            const sourceOutputs = nodeOutputs.get(edge.source);
            if (sourceOutputs && edge.sourceHandle && edge.targetHandle) {
                const outputKey = edge.sourceHandle.split("-")[0];
                const inputKey = edge.targetHandle.split("-")[0];
                if (sourceOutputs[outputKey] !== undefined) {
                    inputs[inputKey] = sourceOutputs[outputKey];
                }
            }
        });

    return inputs;
}

// Execute a single node
export async function executeNode(
    node: WorkflowNode,
    inputs: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const nodeType = node.type as NodeTypeValue;

    switch (nodeType) {
        case NodeType.TEXT:
            return { text: inputs.text || "" };

        case NodeType.UPLOAD_IMAGE:
            return { image_url: inputs.imageUrl || null };

        case NodeType.UPLOAD_VIDEO:
            return { video_url: inputs.videoUrl || null };

        case NodeType.LLM:
            // Call the LLM API endpoint
            const llmResponse = await fetch("/api/llm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: inputs.model,
                    systemPrompt: inputs.systemPrompt || inputs.text,
                    userMessage: inputs.userMessage || inputs.text,
                    images: inputs.images || [],
                }),
            });
            const llmData = await llmResponse.json();
            return { text: llmData.text || llmData.error || "No response" };

        case NodeType.CROP_IMAGE:
            // Call the crop API endpoint
            const cropResponse = await fetch("/api/crop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: inputs.image_url || inputs.imageUrl,
                    xPercent: inputs.xPercent || 0,
                    yPercent: inputs.yPercent || 0,
                    widthPercent: inputs.widthPercent || 100,
                    heightPercent: inputs.heightPercent || 100,
                }),
            });
            const cropData = await cropResponse.json();
            return { image_url: cropData.imageUrl || inputs.image_url };

        case NodeType.EXTRACT_FRAME:
            // Call the extract frame API endpoint
            const frameResponse = await fetch("/api/extract-frame", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl: inputs.video_url || inputs.videoUrl,
                    timestamp: inputs.timestamp || 0,
                }),
            });
            const frameData = await frameResponse.json();
            return { image_url: frameData.imageUrl || null };

        default:
            return {};
    }
}

// Run full workflow
export async function runWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: ExecutionContext
): Promise<boolean> {
    const levels = getExecutionLevels(nodes, edges);

    for (const level of levels) {
        const promises = level.map(async (nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return;

            context.onNodeStart(nodeId);

            try {
                const inputs = resolveNodeInputs(nodeId, nodes, edges, context.nodeOutputs);
                const outputs = await executeNode(node, inputs);
                context.nodeOutputs.set(nodeId, outputs);
                context.onNodeComplete(nodeId, outputs);
            } catch (error) {
                context.onNodeError(nodeId, error instanceof Error ? error.message : "Unknown error");
                throw error;
            }
        });

        await Promise.all(promises);
    }

    return true;
}

// Run only selected nodes (with their upstream dependencies)
export async function runSelectedNodes(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    selectedIds: string[],
    context: ExecutionContext
): Promise<boolean> {
    // Get all upstream dependencies for selected nodes
    const nodesToRun = new Set<string>(selectedIds);

    function addUpstream(nodeId: string) {
        edges.forEach((e) => {
            if (e.target === nodeId && !nodesToRun.has(e.source)) {
                nodesToRun.add(e.source);
                addUpstream(e.source);
            }
        });
    }

    selectedIds.forEach(addUpstream);

    // Filter nodes and edges to only include relevant ones
    const filteredNodes = nodes.filter((n) => nodesToRun.has(n.id));
    const filteredEdges = edges.filter(
        (e) => nodesToRun.has(e.source) && nodesToRun.has(e.target)
    );

    // Run with the filtered graph
    return runWorkflow(filteredNodes, filteredEdges, context);
}

