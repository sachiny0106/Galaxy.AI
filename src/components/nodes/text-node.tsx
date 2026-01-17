"use client";
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Type } from "lucide-react";
import { TextNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";

function TextNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as TextNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const executingNodes = useWorkflowStore((s) => s.executingNodes);
    const isExecuting = executingNodes.has(id);

    return (
        <div className={`workflow-node ${selected ? "selected" : ""} ${isExecuting ? "executing" : ""}`}>
            <div className="node-header">
                <Type className="node-icon" size={18} />
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                <textarea
                    className="input-field"
                    placeholder="Enter text..."
                    value={nodeData.text || ""}
                    onChange={(e) => updateNodeData(id, { text: e.target.value })}
                    rows={3}
                />
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="text-0"
                style={{ background: "var(--accent)" }}
            />
        </div>
    );
}

export const TextNode = memo(TextNodeComponent);
