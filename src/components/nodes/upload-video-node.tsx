"use client";
import { memo, useRef, useState } from "react";
import { Position, NodeProps } from "@xyflow/react";
import { Video, Upload, Loader2 } from "lucide-react";
import { UploadVideoNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { BaseNode } from "./base-node";
import { uploadToTransloadit, isTransloaditConfigured } from "@/lib/transloadit";

function UploadVideoNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as UploadVideoNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isTransloaditConfigured()) {
            console.warn("Transloadit not configured, falling back to local object URL");
            const url = URL.createObjectURL(file);
            updateNodeData(id, { videoUrl: url, fileName: file.name });
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const result = await uploadToTransloadit(file);
            updateNodeData(id, { videoUrl: result.ssl_url, fileName: result.name });
        } catch (err) {
            console.error("Upload failed:", err);
            setError("Upload failed");
            const url = URL.createObjectURL(file);
            updateNodeData(id, { videoUrl: url, fileName: file.name + " (Local Fallback)" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <BaseNode
            id={id}
            title={nodeData.label}
            icon={Video}
            selected={selected}
            handles={[
                { type: "source", position: Position.Right, id: "video_url-0", dataType: "video" }
            ]}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            <button
                className="btn btn-secondary w-full justify-center"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                {isUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <Upload size={14} />
                )}
                {isUploading ? "Uploading..." : nodeData.fileName || "Upload Video"}
            </button>

            {error && (
                <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠ {error}</span>
                </div>
            )}

            {nodeData.videoUrl && (
                <div className="relative group">
                    <video
                        src={nodeData.videoUrl}
                        className="media-preview mt-2"
                        controls
                        muted
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded px-1.5 py-0.5 text-[10px] text-white">
                        {nodeData.videoUrl.startsWith("blob:") ? "Local" : "Cloud"}
                    </div>
                </div>
            )}
        </BaseNode>
    );
}

export const UploadVideoNode = memo(UploadVideoNodeComponent);
