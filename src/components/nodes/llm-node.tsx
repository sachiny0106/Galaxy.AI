"use client";
import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Brain, ChevronDown, ChevronUp, Lock, RefreshCw, AlertTriangle } from "lucide-react";
import { LlmNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { BaseNode } from "./base-node";
import { executeNode, resolveNodeInputs } from "@/lib/execution-engine";

const GEMINI_MODELS = [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash 001" },
    { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Exp)" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Preview)" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Experimental)" },
];

function LlmNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as LlmNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const getConnectedInputs = useWorkflowStore((s) => s.getConnectedInputs);
    const nodes = useWorkflowStore((s) => s.nodes);
    const edges = useWorkflowStore((s) => s.edges);
    const [expanded, setExpanded] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const connected = getConnectedInputs(id);
    const systemPromptConnected = connected.has("systemPrompt-0");
    const userMessageConnected = connected.has("userMessage-0");

    const isError = nodeData.response?.includes("Error") || nodeData.response?.includes("Failed");

    const handleRetry = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRetrying(true);
        updateNodeData(id, { isLoading: true, response: undefined });

        try {
            const partialNodeOutputs = new Map<string, Record<string, unknown>>();
            nodes.forEach(n => {
                if (n.type === "llm") {
                    partialNodeOutputs.set(n.id, { text: (n.data as LlmNodeData).response });
                }
                if (n.type === "text") {
                    partialNodeOutputs.set(n.id, { text: n.data.text });
                }
                if (n.type === "uploadImage") {
                    partialNodeOutputs.set(n.id, { image_url: n.data.imageUrl });
                }
            });

            const inputs = resolveNodeInputs(id, nodes, edges, partialNodeOutputs);
            const output = await executeNode(nodes.find(n => n.id === id)!, inputs);

            updateNodeData(id, { response: output.text as string, isLoading: false });
        } catch (err: any) {
            updateNodeData(id, { response: `Failed: ${err.message}`, isLoading: false });
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <BaseNode
            id={id}
            title={nodeData.label}
            icon={Brain}
            selected={selected}
            handles={[
                { type: "target", position: Position.Left, id: "systemPrompt-0", dataType: "text" }, // System
                { type: "target", position: Position.Left, id: "userMessage-0", dataType: "text" }, // User
                { type: "target", position: Position.Left, id: "image_url-0", dataType: "image" }, // Images
                { type: "source", position: Position.Right, id: "text-0", dataType: "text" }, // Response
            ]}
        >
            {/* Model Selector */}
            <select
                className="input-field"
                value={nodeData.model}
                onChange={(e) => updateNodeData(id, { model: e.target.value })}
            >
                {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>

            {/* System Prompt */}
            <div className="relative group">
                <label className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wider font-medium">
                    System Prompt
                </label>
                <div className="relative">
                    <textarea
                        className={`input-field text-xs transition-opacity ${systemPromptConnected ? "opacity-50 cursor-not-allowed bg-zinc-900/50" : ""}`}
                        placeholder="Define AI persona..."
                        value={nodeData.systemPrompt}
                        onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
                        disabled={systemPromptConnected}
                        rows={2}
                    />
                    {systemPromptConnected && (
                        <div className="absolute top-2 right-2 text-violet-500/80 bg-zinc-950/80 p-1 rounded backdrop-blur">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium">Linked</span>
                                <Lock size={10} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* User Message */}
            <div className="relative group">
                <label className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wider font-medium">
                    User Message
                </label>
                <div className="relative">
                    <textarea
                        className={`input-field text-xs transition-opacity ${userMessageConnected ? "opacity-50 cursor-not-allowed bg-zinc-900/50" : ""}`}
                        placeholder="Enter prompt..."
                        value={nodeData.userMessage}
                        onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
                        disabled={userMessageConnected}
                        rows={2}
                    />
                    {userMessageConnected && (
                        <div className="absolute top-2 right-2 text-violet-500/80 bg-zinc-950/80 p-1 rounded backdrop-blur">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium">Linked</span>
                                <Lock size={10} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Response Display */}
            {nodeData.response && (
                <div className={`output-display transition-all duration-300 ${expanded || isError ? "expanded" : ""}`}>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[10px] font-medium ${isError ? "text-red-400" : "text-violet-400"}`}>
                            {isError ? "AI Error" : "AI Response"}
                        </span>

                        <div className="flex items-center gap-1">
                            {isError && (
                                <button
                                    onClick={handleRetry}
                                    disabled={nodeData.isLoading || isRetrying}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                    title="Retry Request"
                                >
                                    <RefreshCw size={10} className={isRetrying || nodeData.isLoading ? "animate-spin" : ""} />
                                    <span className="text-[9px] font-medium">Retry</span>
                                </button>
                            )}
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-zinc-500 hover:text-zinc-300"
                            >
                                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        </div>
                    </div>

                    {isError ? (
                        <div className="flex flex-col gap-2">
                            {/* Friendly Error Message */}
                            <div className="text-xs text-red-300 leading-relaxed">
                                {nodeData.response?.includes("429") || nodeData.response?.includes("Too Many Requests") ? (
                                    <div className="flex items-start gap-2 bg-red-500/5 p-2 rounded border border-red-500/10">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-red-200">Rate Limit Exceeded</p>
                                            <p className="opacity-80 mt-0.5">
                                                You hit the free tier limit.
                                                {nodeData.response?.match(/retry in ([0-9.]+)s/)?.[1]
                                                    ? <span className="font-mono ml-1 bg-red-500/20 px-1 rounded">Wait {Math.ceil(Number(nodeData.response.match(/retry in ([0-9.]+)s/)?.[1]))}s</span>
                                                    : " Please wait a moment."}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <span>{nodeData.response?.split("[")[0] || "An error occurred."}</span>
                                )}
                            </div>

                            {/* Toggle Raw Details */}
                            <details className="group">
                                <summary className="text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-400 list-none flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-zinc-600 group-open:bg-zinc-400" />
                                    View Error Log
                                </summary>
                                <p className="mt-1 whitespace-pre-wrap text-[10px] text-red-300/50 font-mono bg-black/20 p-2 rounded overflow-x-auto max-h-32">
                                    {nodeData.response}
                                </p>
                            </details>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
                            {nodeData.response}
                        </p>
                    )}
                </div>
            )}
        </BaseNode>
    );
}

export const LlmNode = memo(LlmNodeComponent);
