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
        pending: "bg-zinc-800 text-zinc-400",
        running: "bg-amber-500/20 text-amber-400 border border-amber-500/20",
        success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20",
        failed: "bg-red-500/20 text-red-400 border border-red-500/20",
    }[status];

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${cls}`}>
            {status}
        </span>
    );
}

function NodeExecutionItem({ execution }: { execution: NodeExecution }) {
    const [expanded, setExpanded] = useState(false);
    const StatusIcon = execution.status === "success" ? Check
        : execution.status === "failed" ? XCircle
            : Clock;

    return (
        <div className="bg-zinc-900/40 rounded border border-zinc-800/50 mb-1 text-[11px] overflow-hidden transition-colors hover:bg-zinc-900/60">
            <div
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 p-2 cursor-pointer select-none"
            >
                <StatusIcon
                    size={12}
                    className={
                        execution.status === "success" ? "text-emerald-400"
                            : execution.status === "failed" ? "text-red-400"
                                : "text-zinc-500"
                    }
                />
                <span className="flex-1 text-zinc-300 font-medium truncate">
                    {execution.nodeType.replace(/([A-Z])/g, ' $1').trim()}
                    <span className="text-zinc-600 font-mono ml-1 text-[10px] opacity-70">({execution.nodeId})</span>
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">
                    {formatDuration(execution.duration)}
                </span>
                {expanded ? <ChevronUp size={12} className="text-zinc-600" /> : <ChevronDown size={12} className="text-zinc-600" />}
            </div>

            {expanded && (
                <div className="px-2 pb-2 pl-6">
                    {execution.error && (
                        <div className="text-red-400 mb-2 bg-red-950/30 p-2 rounded text-[10px] leading-relaxed border border-red-900/50">
                            Error: {execution.error}
                        </div>
                    )}
                    {execution.outputs && (
                        <div className="relative group">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Output</span>
                            <pre className="text-[10px] bg-black/40 p-2 rounded text-zinc-400 overflow-x-auto max-h-32 font-mono scrollbar-thin">
                                {JSON.stringify(execution.outputs, null, 2)}
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
        <div className="p-3">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <StatusBadge status={run.status} />
                <span className="text-[10px] text-zinc-500 font-medium">
                    {formatTime(run.startedAt)} • {formatDuration(run.duration)}
                </span>
            </div>

            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
                Execution Steps
            </div>

            {run.nodeExecutions.length === 0 ? (
                <div className="text-xs text-zinc-600 italic px-1">
                    No execution data recorded.
                </div>
            ) : (
                <div className="space-y-1">
                    {run.nodeExecutions.map((exec) => (
                        <NodeExecutionItem key={exec.nodeId} execution={exec} />
                    ))}
                </div>
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
                // In a real app we'd show a toast here
            } else {
                console.error("Failed to save workflow");
            }
        } catch (e) {
            console.error("Failed to save workflow", e);
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
            className={`h-screen border-l border-white/5 transition-all duration-300 flex flex-col glass ${collapsed ? "w-16" : "w-[320px]"}`}
            style={{ backdropFilter: "blur(20px)" }}
        >
            <div className={`flex items-center h-14 border-b border-white/5 ${collapsed ? "justify-center" : "justify-between px-4"}`}>
                {!collapsed && (
                    <span className="font-semibold text-sm text-zinc-100 dark-text-shadow">History</span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>

            {!collapsed && (
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
                    <div className="p-3 border-b border-white/5 flex gap-2">
                        <button
                            className={`btn btn-primary flex-1 flex items-center justify-center gap-2 ${isExecuting || nodes.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={handleRunWorkflow}
                            disabled={isExecuting || nodes.length === 0}
                        >
                            {isExecuting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="text-xs font-semibold">Running</span>
                                </>
                            ) : (
                                <>
                                    <Play size={14} className="fill-current" />
                                    <span className="text-xs font-semibold">Run Workflow</span>
                                </>
                            )}
                        </button>
                        <button
                            className="btn btn-secondary px-3"
                            onClick={handleSaveWorkflow}
                            title="Save Workflow"
                        >
                            <Save size={16} />
                        </button>
                        <div className="w-[1px] bg-white/10 h-6 mx-1" />
                        <button
                            className="btn btn-secondary px-3"
                            onClick={() => {
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }));
                                const downloadAnchorNode = document.createElement('a');
                                downloadAnchorNode.setAttribute("href", dataStr);
                                downloadAnchorNode.setAttribute("download", "workflow.json");
                                document.body.appendChild(downloadAnchorNode);
                                downloadAnchorNode.click();
                                downloadAnchorNode.remove();
                            }}
                            title="Export JSON"
                        >
                            <span className="text-[10px] font-mono">EXP</span>
                        </button>
                        <label className="btn btn-secondary px-3 cursor-pointer" title="Import JSON">
                            <input
                                type="file"
                                className="hidden"
                                accept=".json"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        try {
                                            const json = JSON.parse(event.target?.result as string);
                                            if (json.nodes && json.edges) {
                                                useWorkflowStore.getState().setNodes(json.nodes);
                                                useWorkflowStore.getState().setEdges(json.edges);
                                            }
                                        } catch (err) {
                                            console.error("Failed to parse workflow JSON", err);
                                        }
                                    };
                                    reader.readAsText(file);
                                }}
                            />
                            <span className="text-[10px] font-mono">IMP</span>
                        </label>
                    </div>

                    {isHistoryMode && selectedRun ? (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between p-3 bg-violet-500/10 border-b border-violet-500/10">
                                <span className="text-xs font-medium text-violet-200">Run Details</span>
                                <button
                                    onClick={exitHistoryMode}
                                    className="text-violet-300 hover:text-white transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <RunDetailView run={selectedRun} />
                        </div>
                    ) : (
                        <div className="p-3 space-y-1">
                            {runs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                                    <History size={32} className="opacity-20 mb-2" />
                                    <p className="text-xs">No runs yet</p>
                                </div>
                            ) : (
                                runs.map((run) => (
                                    <div
                                        key={run.id}
                                        onClick={() => enterHistoryMode(run.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${selectedRunId === run.id
                                            ? "bg-violet-500/10 border-violet-500/20"
                                            : "bg-zinc-900/20 border-white/5 hover:bg-zinc-800/40 hover:border-white/10"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <StatusBadge status={run.status} />
                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                {formatTime(run.startedAt)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-zinc-400">
                                            <span className="group-hover:text-zinc-200 transition-colors">Full Run</span>
                                            <span className="font-mono text-zinc-600 group-hover:text-zinc-400">{formatDuration(run.duration)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
