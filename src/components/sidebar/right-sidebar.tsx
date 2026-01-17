"use client";
import { useState } from "react";
import { History, ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useWorkflowStore } from "@/store/workflow-store";
import { RunStatus, WorkflowRun } from "@/types/workflow";
import { runWorkflow, ExecutionContext } from "@/lib/execution-engine";

function formatDuration(ms: number | null): string {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(date: Date): string {
    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(date);
}

function StatusBadge({ status }: { status: RunStatus }) {
    const cls = {
        pending: "badge-pending",
        running: "badge-warning",
        success: "badge-success",
        failed: "badge-error",
    }[status];

    return <span className={`badge ${cls}`}>{status}</span>;
}

export function RightSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const runs = useHistoryStore((s) => s.runs);
    const selectedRunId = useHistoryStore((s) => s.selectedRunId);
    const isHistoryMode = useHistoryStore((s) => s.isHistoryMode);
    const enterHistoryMode = useHistoryStore((s) => s.enterHistoryMode);
    const exitHistoryMode = useHistoryStore((s) => s.exitHistoryMode);
    const addRun = useHistoryStore((s) => s.addRun);
    const updateRun = useHistoryStore((s) => s.updateRun);

    const nodes = useWorkflowStore((s) => s.nodes);
    const edges = useWorkflowStore((s) => s.edges);
    const isExecuting = useWorkflowStore((s) => s.isExecuting);
    const setExecuting = useWorkflowStore((s) => s.setExecuting);
    const setNodeExecuting = useWorkflowStore((s) => s.setNodeExecuting);
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

    const handleRunWorkflow = async () => {
        if (nodes.length === 0) return;

        const runId = `run-${Date.now()}`;
        const startTime = Date.now();

        const newRun: WorkflowRun = {
            id: runId,
            status: "running",
            startedAt: new Date(),
            completedAt: null,
            duration: null,
            scope: "full",
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
                // Update node with output if it's an LLM node
                const node = nodes.find((n) => n.id === nodeId);
                if (node?.type === "llm" && outputs.text) {
                    updateNodeData(nodeId, { response: outputs.text, isLoading: false });
                }
            },
            onNodeError: (nodeId, error) => {
                setNodeExecuting(nodeId, false);
                console.error(`Node ${nodeId} error:`, error);
            },
        };

        try {
            await runWorkflow(nodes, edges, context);
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

    return (
        <div
            className={`sidebar ${collapsed ? "collapsed" : ""}`}
            style={{
                width: collapsed ? 60 : 280,
                borderRight: "none",
                borderLeft: "1px solid var(--border)",
            }}
        >
            <div className="sidebar-header">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                    }}
                >
                    {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
                {!collapsed && (
                    <span style={{ fontWeight: 600, fontSize: 14, marginLeft: 8 }}>History</span>
                )}
            </div>

            {!collapsed && (
                <>
                    {/* Run Button */}
                    <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleRunWorkflow}
                            disabled={isExecuting || nodes.length === 0}
                            style={{ width: "100%" }}
                        >
                            {isExecuting ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16 }} />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    Run Workflow
                                </>
                            )}
                        </button>
                    </div>

                    {/* History Mode Banner */}
                    {isHistoryMode && (
                        <div
                            style={{
                                padding: "8px 12px",
                                background: "rgba(139, 92, 246, 0.2)",
                                borderBottom: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: 12,
                            }}
                        >
                            <span>Viewing History</span>
                            <button
                                onClick={exitHistoryMode}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--accent)",
                                    cursor: "pointer",
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Runs List */}
                    <div className="sidebar-content" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {runs.length === 0 ? (
                            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 20, fontSize: 13 }}>
                                <History size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                                <p>No runs yet</p>
                            </div>
                        ) : (
                            runs.map((run) => (
                                <div
                                    key={run.id}
                                    className={`history-item ${selectedRunId === run.id ? "active" : ""}`}
                                    onClick={() => enterHistoryMode(run.id)}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <StatusBadge status={run.status} />
                                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                            {formatTime(run.startedAt)}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
                                        <span>{run.scope === "full" ? "Full Run" : "Single Node"}</span>
                                        <span>{formatDuration(run.duration)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
