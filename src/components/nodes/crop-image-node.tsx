"use client";
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Crop } from "lucide-react";
import { CropImageNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";

function CropImageNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as CropImageNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const getConnectedInputs = useWorkflowStore((s) => s.getConnectedInputs);
    const executingNodes = useWorkflowStore((s) => s.executingNodes);
    const isExecuting = executingNodes.has(id);

    const connected = getConnectedInputs(id);
    const imageConnected = connected.has("image_url-0");

    const handleNumericChange = (field: string, value: string) => {
        const num = parseFloat(value) || 0;
        const clamped = Math.max(0, Math.min(100, num));
        updateNodeData(id, { [field]: clamped });
    };

    return (
        <div className={`workflow-node ${selected ? "selected" : ""} ${isExecuting ? "executing" : ""}`}>
            <div className="node-header">
                <Crop className="node-icon" size={18} />
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                {/* Image Input Info */}
                <div style={{ fontSize: 11, color: imageConnected ? "var(--success)" : "var(--text-muted)", marginBottom: 8 }}>
                    Image: {imageConnected ? "✓ Connected" : "⚠ Not connected"}
                </div>

                {/* Crop Parameters */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                        <label style={{ fontSize: 10, color: "var(--text-muted)" }}>X %</label>
                        <input
                            type="number"
                            className="input-field"
                            value={nodeData.xPercent}
                            onChange={(e) => handleNumericChange("xPercent", e.target.value)}
                            min={0}
                            max={100}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 10, color: "var(--text-muted)" }}>Y %</label>
                        <input
                            type="number"
                            className="input-field"
                            value={nodeData.yPercent}
                            onChange={(e) => handleNumericChange("yPercent", e.target.value)}
                            min={0}
                            max={100}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 10, color: "var(--text-muted)" }}>Width %</label>
                        <input
                            type="number"
                            className="input-field"
                            value={nodeData.widthPercent}
                            onChange={(e) => handleNumericChange("widthPercent", e.target.value)}
                            min={0}
                            max={100}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 10, color: "var(--text-muted)" }}>Height %</label>
                        <input
                            type="number"
                            className="input-field"
                            value={nodeData.heightPercent}
                            onChange={(e) => handleNumericChange("heightPercent", e.target.value)}
                            min={0}
                            max={100}
                        />
                    </div>
                </div>

                {/* Output Preview */}
                {nodeData.outputUrl && (
                    <img src={nodeData.outputUrl} alt="Cropped" className="media-preview" />
                )}
            </div>

            {/* Input Handle */}
            <Handle type="target" position={Position.Left} id="image_url-0" style={{ background: "var(--accent)" }} />

            {/* Output Handle */}
            <Handle type="source" position={Position.Right} id="image_url-0" style={{ background: "var(--accent)" }} />
        </div>
    );
}

export const CropImageNode = memo(CropImageNodeComponent);
