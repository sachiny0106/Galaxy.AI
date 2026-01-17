"use client";
import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { LlmNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";

const GEMINI_MODELS = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
];

function LlmNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as LlmNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const getConnectedInputs = useWorkflowStore((s) => s.getConnectedInputs);
    const executingNodes = useWorkflowStore((s) => s.executingNodes);
    const isExecuting = executingNodes.has(id);
    const [expanded, setExpanded] = useState(false);

    const connected = getConnectedInputs(id);
    const systemPromptConnected = connected.has("text-0");
    const userMessageConnected = connected.has("text-1");
    const imagesConnected = connected.has("image_url-0");

    return (
        <div className={`workflow-node ${selected ? "selected" : ""} ${isExecuting ? "executing" : ""}`} style={{ minWidth: 280 }}>
            <div className="node-header">
                <Brain className="node-icon" size={18} />
                <span className="node-title">{nodeData.label}</span>
                {nodeData.isLoading && <div className="spinner" style={{ marginLeft: "auto" }} />}
            </div>
            <div className="node-content">
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
                <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                        System Prompt {systemPromptConnected && "(connected)"}
                    </label>
                    <textarea
                        className="input-field"
                        placeholder="Optional system prompt..."
                        value={nodeData.systemPrompt}
                        onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
                        disabled={systemPromptConnected}
                        rows={2}
                    />
                </div>

                {/* User Message */}
                <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                        User Message {userMessageConnected && "(connected)"}
                    </label>
                    <textarea
                        className="input-field"
                        placeholder="Enter your prompt..."
                        value={nodeData.userMessage}
                        onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
                        disabled={userMessageConnected}
                        rows={2}
                    />
                </div>

                {/* Response Display */}
                {nodeData.response && (
                    <div className={`output-display ${expanded ? "expanded" : ""}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Response</span>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer" }}
                            >
                                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                        <p style={{ whiteSpace: "pre-wrap" }}>{nodeData.response}</p>
                    </div>
                )}
            </div>

            {/* Input Handles */}
            <Handle type="target" position={Position.Left} id="text-0" style={{ top: "30%", background: "var(--accent)" }} />
            <Handle type="target" position={Position.Left} id="text-1" style={{ top: "50%", background: "var(--accent)" }} />
            <Handle type="target" position={Position.Left} id="image_url-0" style={{ top: "70%", background: "var(--accent)" }} />

            {/* Output Handle */}
            <Handle type="source" position={Position.Right} id="text-0" style={{ background: "var(--accent)" }} />
        </div>
    );
}

export const LlmNode = memo(LlmNodeComponent);
