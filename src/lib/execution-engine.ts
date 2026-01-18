import { WorkflowNode, WorkflowEdge, NodeType, NodeTypeValue } from "@/types/workflow";

export interface ExecutionContext {
    nodeOutputs: Map<string, Record<string, unknown>>;
    onNodeStart: (nodeId: string) => void;
    onNodeComplete: (nodeId: string, outputs: Record<string, unknown>) => void;
    onNodeError: (nodeId: string, error: string) => void;
}

// Group nodes into parallel execution levels
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

        for (const nodeId of currentLevel) {
            const neighbors = adj.get(nodeId) || [];
            for (const neighbor of neighbors) {
                inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
                if (inDegree.get(neighbor) === 0) nextLevel.push(neighbor);
            }
        }
        currentLevel = nextLevel;
    }

    return levels;
}

export function resolveNodeInputs(
    nodeId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    nodeOutputs: Map<string, Record<string, unknown>>
): Record<string, unknown> {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return {};

    const inputs = { ...(node.data as Record<string, unknown>) };
    const connectedEdges = edges.filter((e) => e.target === nodeId);

    for (const edge of connectedEdges) {
        if (!edge.sourceHandle || !edge.targetHandle) continue;

        const sourceOut = nodeOutputs.get(edge.source);
        if (!sourceOut) continue;

        const outputKey = edge.sourceHandle.split("-")[0];
        const inputKey = edge.targetHandle.split("-")[0];

        if (sourceOut[outputKey] !== undefined) {
            inputs[inputKey] = sourceOut[outputKey];
        }
    }

    return inputs;
}

export async function executeNode(
    node: WorkflowNode,
    inputs: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const type = node.type as NodeTypeValue;

    // Simple pass-throughs
    if (type === NodeType.TEXT) return { text: inputs.text || "" };
    if (type === NodeType.UPLOAD_IMAGE) return { image_url: inputs.imageUrl || null };
    if (type === NodeType.UPLOAD_VIDEO) return { video_url: inputs.videoUrl || null };

    // API Calls
    let endpoint = "";
    let body = {};

    switch (type) {
        case NodeType.LLM:
            endpoint = "/api/llm";
            body = {
                model: inputs.model,
                systemPrompt: inputs.systemPrompt || inputs.text,
                userMessage: inputs.userMessage || inputs.text,
                images: inputs.images || [],
            };
            break;

        case NodeType.CROP_IMAGE:
            endpoint = "/api/crop";
            body = {
                imageUrl: inputs.image_url || inputs.imageUrl,
                xPercent: inputs.xPercent || 0,
                yPercent: inputs.yPercent || 0,
                widthPercent: inputs.widthPercent || 100,
                heightPercent: inputs.heightPercent || 100,
            };
            break;

        case NodeType.EXTRACT_FRAME:
            endpoint = "/api/extract-frame";
            body = {
                videoUrl: inputs.video_url || inputs.videoUrl,
                timestamp: inputs.timestamp || 0,
            };
            break;

        default:
            return {};
    }

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (type === NodeType.LLM) return { text: data.text || data.error || "No response" };
        if (type === NodeType.CROP_IMAGE) return { image_url: data.imageUrl || inputs.image_url };
        if (type === NodeType.EXTRACT_FRAME) return { image_url: data.imageUrl || null };

        return {};
    } catch (e) {
        console.warn(`Execution failed for ${type}:`, e);
        throw e;
    }
}

export async function runWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: ExecutionContext
): Promise<boolean> {
    const nodePromises = new Map<string, Promise<void>>();
    const completedNodes = new Set<string>();

    const getNodePromise = (nodeId: string): Promise<void> => {
        if (nodePromises.has(nodeId)) {
            return nodePromises.get(nodeId)!;
        }

        const promise = (async () => {
            // Find inputs (parent nodes)
            const parentIds = edges
                .filter((e) => e.target === nodeId)
                .map((e) => e.source);

            // Wait for all parents to complete
            await Promise.all(parentIds.map((id) => getNodePromise(id)));

            // If we are executing only selected nodes, we might skip upstream execution
            // But for "runWorkflow" (full), we run everything. 
            // The recursion ensures we wait for parents.

            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return;

            // Execute this node
            context.onNodeStart(nodeId);

            try {
                const inputs = resolveNodeInputs(nodeId, nodes, edges, context.nodeOutputs);
                const outputs = await executeNode(node, inputs);
                context.nodeOutputs.set(nodeId, outputs);
                context.onNodeComplete(nodeId, outputs);
                completedNodes.add(nodeId);
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Unknown error";
                context.onNodeError(nodeId, msg);
                throw error; // Propagate error upstream/downstream behavior? 
                // Creating a rejection will stop dependent nodes.
            }
        })();

        nodePromises.set(nodeId, promise);
        return promise;
    };

    // Trigger execution for all nodes (they will auto-wait for dependencies)
    // We ideally only need to trigger leaf nodes, but triggering all is safe because of the caching in `nodePromises`.
    try {
        await Promise.all(nodes.map((n) => getNodePromise(n.id)));
        return true;
    } catch (error) {
        return false; // Error handled in context callbacks
    }
}

export async function runSelectedNodes(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    selectedIds: string[],
    context: ExecutionContext
): Promise<boolean> {
    // recursively find dependencies
    const toRun = new Set<string>(selectedIds);
    const addDeps = (id: string) => {
        edges.filter(e => e.target === id).forEach(e => {
            if (!toRun.has(e.source)) {
                toRun.add(e.source);
                addDeps(e.source);
            }
        })
    };

    selectedIds.forEach(addDeps);

    const filteredNodes = nodes.filter(n => toRun.has(n.id));
    const filteredEdges = edges.filter(e => toRun.has(e.source) && toRun.has(e.target));

    return runWorkflow(filteredNodes, filteredEdges, context);
}
