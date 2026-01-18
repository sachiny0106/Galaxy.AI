"use client";
import { memo, useRef, useState } from "react";
import { Position, NodeProps } from "@xyflow/react";
import { ImageIcon, Upload, Loader2, RefreshCw } from "lucide-react";
import { UploadImageNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { BaseNode } from "./base-node";
import { uploadToTransloadit, isTransloaditConfigured } from "@/lib/transloadit";

function UploadImageNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as UploadImageNodeData;
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
            updateNodeData(id, { imageUrl: url, fileName: file.name });
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const result = await uploadToTransloadit(file);
            updateNodeData(id, { imageUrl: result.ssl_url, fileName: result.name });
        } catch (err) {
            console.error("Upload failed:", err);
            setError("Upload failed");
            const url = URL.createObjectURL(file);
            updateNodeData(id, { imageUrl: url, fileName: file.name + " (Local Fallback)" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <BaseNode
            id={id}
            title={nodeData.label}
            icon={ImageIcon}
            selected={selected}
            handles={[
                { type: "source", position: Position.Right, id: "image_url-0", dataType: "image" }
            ]}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
                {isUploading ? "Uploading..." : nodeData.fileName || "Upload Image"}
            </button>

            {error && (
                <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠ {error}</span>
                </div>
            )}

            {nodeData.imageUrl && (
                <div className="relative group">
                    <img
                        src={nodeData.imageUrl}
                        alt="Preview"
                        className="media-preview mt-2"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded px-1.5 py-0.5 text-[10px] text-white">
                        {nodeData.imageUrl.startsWith("blob:") ? "Local" : "Cloud"}
                    </div>
                </div>
            )}
        </BaseNode>
    );
}

export const UploadImageNode = memo(UploadImageNodeComponent);
