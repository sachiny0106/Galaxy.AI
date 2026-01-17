"use client";
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Film } from "lucide-react";
import { ExtractFrameNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";

function ExtractFrameNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as ExtractFrameNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const getConnectedInputs = useWorkflowStore((s) => s.getConnectedInputs);
    const executingNodes = useWorkflowStore((s) => s.executingNodes);
    const isExecuting = executingNodes.has(id);

    const connected = getConnectedInputs(id);
    const videoConnected = connected.has("video_url-0");

    return (
        <div className={`workflow-node ${selected ? "selected" : ""} ${isExecuting ? "executing" : ""}`}>
            <div className="node-header">
                <Film className="node-icon" size={18} />
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                {/* Video Input Info */}
                <div style={{ fontSize: 11, color: videoConnected ? "var(--success)" : "var(--text-muted)", marginBottom: 8 }}>
                    Video: {videoConnected ? "✓ Connected" : "⚠ Not connected"}
                </div>

                {/* Timestamp Parameter */}
                <div>
                    <label style={{ fontSize: 10, color: "var(--text-muted)" }}>Timestamp (seconds)</label>
                    <input
                        type="number"
                        className="input-field"
                        value={nodeData.timestamp}
                        onChange={(e) => updateNodeData(id, { timestamp: parseFloat(e.target.value) || 0 })}
                        min={0}
                        step={0.1}
                    />
                </div>

                {/* Output Preview */}
                {nodeData.outputUrl && (
                    <img src={nodeData.outputUrl} alt="Frame" className="media-preview" />
                )}
            </div>

            {/* Input Handle */}
            <Handle type="target" position={Position.Left} id="video_url-0" style={{ background: "var(--accent)" }} />

            {/* Output Handle */}
            <Handle type="source" position={Position.Right} id="image_url-0" style={{ background: "var(--accent)" }} />
        </div>
    );
}

export const ExtractFrameNode = memo(ExtractFrameNodeComponent);
