"use client";
import { useState } from "react";
import { History, ChevronLeft, ChevronRight, X, Play, Check, XCircle, Clock, ChevronDown, ChevronUp, Save } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useWorkflowStore } from "@/store/workflow-store";
import { RunStatus, WorkflowRun, NodeExecution } from "@/types/workflow";
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

function NodeExecutionItem({ execution }: { execution: NodeExecution }) {
    const [expanded, setExpanded] = useState(false);
    const StatusIcon = execution.status === "success" ? Check
        : execution.status === "failed" ? XCircle
            : Clock;

    return (
        <div
            style={{
                padding: "6px 8px",
                background: "rgba(0,0,0,0.2)",
                borderRadius: 4,
                marginBottom: 4,
                fontSize: 11,
            }}
        >
            <div
                onClick={() => setExpanded(!expanded)}
                style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
                <StatusIcon
                    size={12}
                    style={{
                        color: execution.status === "success" ? "var(--success)"
                            : execution.status === "failed" ? "var(--error)"
                                : "var(--text-muted)",
                    }}
                />
                <span style={{ flex: 1, color: "var(--text-secondary)" }}>
                    {execution.nodeType} ({execution.nodeId})
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                    {formatDuration(execution.duration)}
                </span>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>

            {expanded && (
                <div style={{ marginTop: 6, paddingLeft: 18, color: "var(--text-muted)" }}>
                    {execution.error && (
                        <div style={{ color: "var(--error)", marginBottom: 4 }}>
                            Error: {execution.error}
                        </div>
                    )}
                    {execution.outputs && (
                        <div style={{ marginBottom: 4 }}>
                            <strong>Output:</strong>
                            <pre style={{
                                fontSize: 10,
                                maxHeight: 60,
                                overflow: "auto",
                                background: "rgba(0,0,0,0.3)",
                                padding: 4,
                                borderRadius: 2,
                                marginTop: 2,
                            }}>
                                {JSON.stringify(execution.outputs, null, 2).substring(0, 200)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RunDetailView({ run }: { run: WorkflowRun }) {
    return (
        <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 12 }}>
                <StatusBadge status={run.status} />
                <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>
                    {formatTime(run.startedAt)} • {formatDuration(run.duration)}
                </span>
            </div>

            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
                Node Executions
            </div>

            {run.nodeExecutions.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    No node execution details available
                </div>
            ) : (
                run.nodeExecutions.map((exec) => (
                    <NodeExecutionItem key={exec.nodeId} execution={exec} />
                ))
            )}
        </div>
    );
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

    const selectedRun = runs.find((r) => r.id === selectedRunId);

    const handleSaveWorkflow = async () => {
        try {
            const response = await fetch("/api/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `Workflow ${new Date().toLocaleString()}`,
                    nodes,
                    edges,
                }),
            });
            if (response.ok) {
                alert("Workflow saved!");
            } else {
                const data = await response.json();
                alert(data.error || "Failed to save");
            }
        } catch (e) {
            alert("Failed to save workflow");
        }
    };

    const handleRunWorkflow = async () => {
        if (nodes.length === 0) return;

        const runId = `run-${Date.now()}`;
        const startTime = Date.now();
        const nodeExecutions: NodeExecution[] = [];

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
                const node = nodes.find((n) => n.id === nodeId);
                nodeExecutions.push({
                    nodeId,
                    nodeType: node?.type || "unknown",
                    status: "running",
                    startedAt: new Date(),
                    completedAt: null,
                    duration: null,
                    inputs: null,
                    outputs: null,
                    error: null,
                });
            },
            onNodeComplete: (nodeId, outputs) => {
                setNodeExecuting(nodeId, false);
                const exec = nodeExecutions.find((e) => e.nodeId === nodeId);
                if (exec) {
                    exec.status = "success";
                    exec.completedAt = new Date();
                    exec.duration = Date.now() - (exec.startedAt?.getTime() || 0);
                    exec.outputs = outputs;
                }
                // Update node with output if it's an LLM node
                const node = nodes.find((n) => n.id === nodeId);
                if (node?.type === "llm" && outputs.text) {
                    updateNodeData(nodeId, { response: outputs.text, isLoading: false });
                }
            },
            onNodeError: (nodeId, error) => {
                setNodeExecuting(nodeId, false);
                const exec = nodeExecutions.find((e) => e.nodeId === nodeId);
                if (exec) {
                    exec.status = "failed";
                    exec.error = error;
                    exec.completedAt = new Date();
                    exec.duration = Date.now() - (exec.startedAt?.getTime() || 0);
                }
                console.error(`Node ${nodeId} error:`, error);
            },
        };

        try {
            await runWorkflow(nodes, edges, context);
            updateRun(runId, {
                status: "success",
                completedAt: new Date(),
                duration: Date.now() - startTime,
                nodeExecutions,
            });
        } catch (error) {
            updateRun(runId, {
                status: "failed",
                completedAt: new Date(),
                duration: Date.now() - startTime,
                nodeExecutions,
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
                    className="sidebar-toggle"
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
                    <div style={{ padding: 12, borderBottom: "1px solid var(--border)", display: "flex", gap: 8 }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleRunWorkflow}
                            disabled={isExecuting || nodes.length === 0}
                            style={{ flex: 1 }}
                        >
                            {isExecuting ? (
                                <div className="flex items-center gap-2">
                                    <div className="spinner" style={{ width: 16, height: 16 }} />
                                    <span>Running...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 justify-center">
                                    <Play size={16} />
                                    <span>Run Workflow</span>
                                </div>
                            )}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleSaveWorkflow}
                            title="Save Workflow"
                            style={{ padding: "8px 12px" }}
                        >
                            <Save size={16} />
                        </button>
                    </div>

                    {isHistoryMode && selectedRun ? (
                        <>
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
                                <span>Run Details</span>
                                <button
                                    onClick={exitHistoryMode}
                                    style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer" }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <RunDetailView run={selectedRun} />
                        </>
                    ) : (
                        <div className="sidebar-content flex flex-col gap-2">
                            {runs.length === 0 ? (
                                <div className="text-center text-muted p-5 text-sm">
                                    <History size={32} className="opacity-50 mb-2 mx-auto" />
                                    <p>No runs yet</p>
                                </div>
                            ) : (
                                runs.map((run) => (
                                    <div
                                        key={run.id}
                                        className={`history-item ${selectedRunId === run.id ? "active" : ""}`}
                                        onClick={() => enterHistoryMode(run.id)}
                                    >
                                        <div className="flex justify-between items-center mb-1.5">
                                            <StatusBadge status={run.status} />
                                            <span className="text-xs text-muted">
                                                {formatTime(run.startedAt)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-secondary">
                                            <span>{run.scope === "full" ? "Full Run" : "Single Node"}</span>
                                            <span>{formatDuration(run.duration)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
