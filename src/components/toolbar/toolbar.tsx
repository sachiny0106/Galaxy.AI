"use client";
import { useRef } from "react";
import {
    Download,
    Upload,
    Play,
    PlayCircle,
    Trash2,
    Undo,
    Redo,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { useHistoryStore } from "@/store/history-store";
import { WorkflowRun, WorkflowNode, WorkflowEdge } from "@/types/workflow";
import { runWorkflow, runSelectedNodes, ExecutionContext } from "@/lib/execution-engine";

export function Toolbar() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nodes = useWorkflowStore((s) => s.nodes);
    const edges = useWorkflowStore((s) => s.edges);
    const setNodes = useWorkflowStore((s) => s.setNodes);
    const setEdges = useWorkflowStore((s) => s.setEdges);
    const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
    const isExecuting = useWorkflowStore((s) => s.isExecuting);
    const setExecuting = useWorkflowStore((s) => s.setExecuting);
    const setNodeExecuting = useWorkflowStore((s) => s.setNodeExecuting);
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const deleteNode = useWorkflowStore((s) => s.deleteNode);

    const addRun = useHistoryStore((s) => s.addRun);
    const updateRun = useHistoryStore((s) => s.updateRun);

    // Export workflow as JSON
    const handleExport = () => {
        const workflow = {
            name: "Exported Workflow",
            nodes,
            edges,
            exportedAt: new Date().toISOString(),
        };
        const json = JSON.stringify(workflow, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workflow-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import workflow from JSON
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                if (data.nodes && data.edges) {
                    setNodes(data.nodes as WorkflowNode[]);
                    setEdges(data.edges as WorkflowEdge[]);
                } else {
                    alert("Invalid workflow file format");
                }
            } catch (err) {
                alert("Failed to import workflow");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    // Run entire workflow
    const handleRunAll = async () => {
        if (nodes.length === 0 || isExecuting) return;
        await executeWorkflow("full");
    };

    // Run only selected node
    const handleRunSelected = async () => {
        if (!selectedNodeId || isExecuting) return;
        await executeWorkflow("single", [selectedNodeId]);
    };

    // Execute workflow with scope
    const executeWorkflow = async (scope: "full" | "single" | "selected", nodeIds?: string[]) => {
        const runId = `run-${Date.now()}`;
        const startTime = Date.now();

        const newRun: WorkflowRun = {
            id: runId,
            status: "running",
            startedAt: new Date(),
            completedAt: null,
            duration: null,
            scope: scope === "full" ? "full" : "single",
            nodeExecutions: [],
        };

        addRun(newRun);
        setExecuting(true);

        const context: ExecutionContext = {
            nodeOutputs: new Map(),
            onNodeStart: (nodeId) => {
                setNodeExecuting(nodeId, true);
            },
            onNodeComplete: (nodeId, outputs) => {
                setNodeExecuting(nodeId, false);
                const node = nodes.find((n) => n.id === nodeId);
                if (node?.type === "llm" && outputs.text) {
                    updateNodeData(nodeId, { response: outputs.text, isLoading: false });
                }
                if ((node?.type === "cropImage" || node?.type === "extractFrame") && outputs.image_url) {
                    updateNodeData(nodeId, { outputUrl: outputs.image_url });
                }
            },
            onNodeError: (nodeId, error) => {
                setNodeExecuting(nodeId, false);
                console.error(`Node ${nodeId} error:`, error);
            },
        };

        try {
            if (scope === "full") {
                await runWorkflow(nodes, edges, context);
            } else {
                await runSelectedNodes(nodes, edges, nodeIds || [], context);
            }
            updateRun(runId, {
                status: "success",
                completedAt: new Date(),
                duration: Date.now() - startTime,
            });
        } catch (error) {
            updateRun(runId, {
                status: "failed",
                completedAt: new Date(),
                duration: Date.now() - startTime,
            });
        } finally {
            setExecuting(false);
        }
    };

    // Delete selected node
    const handleDelete = () => {
        if (selectedNodeId) {
            deleteNode(selectedNodeId);
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                display: "flex",
                gap: 8,
                padding: "8px 12px",
                background: "var(--surface)",
                backdropFilter: "blur(12px)",
                borderRadius: 8,
                border: "1px solid var(--border)",
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: "none" }}
            />

            <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                title="Import Workflow"
                style={{ padding: "6px 10px" }}
            >
                <Upload size={16} />
            </button>

            <button
                className="btn btn-secondary"
                onClick={handleExport}
                title="Export Workflow"
                style={{ padding: "6px 10px" }}
            >
                <Download size={16} />
            </button>

            <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

            <button
                className="btn btn-secondary"
                onClick={handleDelete}
                disabled={!selectedNodeId}
                title="Delete Selected Node"
                style={{ padding: "6px 10px" }}
            >
                <Trash2 size={16} />
            </button>

            <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

            <button
                className="btn btn-secondary"
                onClick={() => {
                    const { undo, pastStates } = useWorkflowStore.temporal.getState();
                    if (pastStates.length > 0) undo();
                }}
                title="Undo"
                style={{ padding: "6px 10px" }}
            >
                <Undo size={16} />
            </button>

            <button
                className="btn btn-secondary"
                onClick={() => {
                    const { redo, futureStates } = useWorkflowStore.temporal.getState();
                    if (futureStates.length > 0) redo();
                }}
                title="Redo"
                style={{ padding: "6px 10px" }}
            >
                <Redo size={16} />
            </button>

            <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

            <button
                className="btn btn-secondary"
                onClick={handleRunSelected}
                disabled={!selectedNodeId || isExecuting}
                title="Run Selected Node"
                style={{ padding: "6px 10px" }}
            >
                <PlayCircle size={16} />
            </button>

            <button
                className="btn btn-primary"
                onClick={handleRunAll}
                disabled={nodes.length === 0 || isExecuting}
                title="Run Entire Workflow"
                style={{ padding: "6px 12px" }}
            >
                {isExecuting ? (
                    <div className="spinner" style={{ width: 14, height: 14 }} />
                ) : (
                    <Play size={16} />
                )}
                <span style={{ marginLeft: 4 }}>Run All</span>
            </button>
        </div>
    );
}
