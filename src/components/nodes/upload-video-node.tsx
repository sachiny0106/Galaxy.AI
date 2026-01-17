"use client";
import { memo, useRef } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Video, Upload } from "lucide-react";
import { UploadVideoNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";

function UploadVideoNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as UploadVideoNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const executingNodes = useWorkflowStore((s) => s.executingNodes);
    const isExecuting = executingNodes.has(id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            updateNodeData(id, { videoUrl: url, fileName: file.name });
        }
    };

    return (
        <div className={`workflow-node ${selected ? "selected" : ""} ${isExecuting ? "executing" : ""}`}>
            <div className="node-header">
                <Video className="node-icon" size={18} />
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
                <button
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={14} />
                    {nodeData.fileName || "Upload Video"}
                </button>
                {nodeData.videoUrl && (
                    <video
                        src={nodeData.videoUrl}
                        className="media-preview"
                        controls
                        muted
                    />
                )}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="video_url-0"
                style={{ background: "var(--accent)" }}
            />
        </div>
    );
}

export const UploadVideoNode = memo(UploadVideoNodeComponent);
