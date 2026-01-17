"use client";
import { memo, useRef } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ImageIcon, Upload } from "lucide-react";
import { UploadImageNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";

function UploadImageNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as UploadImageNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const executingNodes = useWorkflowStore((s) => s.executingNodes);
    const isExecuting = executingNodes.has(id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // For demo: create local URL. In production, use Transloadit
            const url = URL.createObjectURL(file);
            updateNodeData(id, { imageUrl: url, fileName: file.name });
        }
    };

    return (
        <div className={`workflow-node ${selected ? "selected" : ""} ${isExecuting ? "executing" : ""}`}>
            <div className="node-header">
                <ImageIcon className="node-icon" size={18} />
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
                <button
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={14} />
                    {nodeData.fileName || "Upload Image"}
                </button>
                {nodeData.imageUrl && (
                    <img
                        src={nodeData.imageUrl}
                        alt="Preview"
                        className="media-preview"
                    />
                )}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="image_url-0"
                style={{ background: "var(--accent)" }}
            />
        </div>
    );
}

export const UploadImageNode = memo(UploadImageNodeComponent);
