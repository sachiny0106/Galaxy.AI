"use client";
import { memo } from "react";
import { Position, NodeProps } from "@xyflow/react";
import { Type } from "lucide-react";
import { TextNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { BaseNode } from "./base-node";

function TextNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as TextNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

    return (
        <BaseNode
            id={id}
            title={nodeData.label}
            icon={Type}
            selected={selected}
            handles={[
                { type: "source", position: Position.Right, id: "text-0", dataType: "text" }
            ]}
        >
            <textarea
                className="input-field"
                placeholder="Enter text..."
                value={nodeData.text || ""}
                onChange={(e) => updateNodeData(id, { text: e.target.value })}
                rows={3}
            />
        </BaseNode>
    );
}

export const TextNode = memo(TextNodeComponent);
