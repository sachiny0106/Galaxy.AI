"use client";
import { memo } from "react";
import { Position, NodeProps, Handle } from "@xyflow/react";
import { Film } from "lucide-react";
import { ExtractFrameNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { BaseNode } from "./base-node";

function ExtractFrameNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as ExtractFrameNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const getConnectedInputs = useWorkflowStore((s) => s.getConnectedInputs);

    const connected = getConnectedInputs(id);
    const videoConnected = connected.has("video_url-0");

    return (
        <BaseNode
            id={id}
            title={nodeData.label}
            icon={Film}
            selected={selected}
            handles={[
                { type: "target", position: Position.Left, id: "video_url-0", dataType: "video" },
                { type: "source", position: Position.Right, id: "image_url-0", dataType: "image" }
            ]}
        >
            {/* Video Input Info */}
            <div className={`text-xs mb-2 ${videoConnected ? "text-green-500" : "text-zinc-500"}`}>
                Video: {videoConnected ? "✓ Connected" : "⚠ Not connected"}
            </div>

            {/* Timestamp Parameter */}
            <div className="relative">
                <Handle
                    type="target"
                    position={Position.Left}
                    id="timestamp-0"
                    className="!w-2 !h-2 !-left-3 !bg-zinc-600"
                    style={{ top: '65%' }}
                />
                <label className="text-[10px] text-zinc-500 mb-1 block uppercase flex items-center gap-1">
                    Timestamp (seconds)
                    {connected.has("timestamp-0") && <div className="w-1 h-1 rounded-full bg-violet-500" />}
                </label>
                <input
                    type="number"
                    className={`input-field ${connected.has("timestamp-0") ? "opacity-50 cursor-not-allowed bg-zinc-900/50" : ""}`}
                    value={nodeData.timestamp}
                    onChange={(e) => updateNodeData(id, { timestamp: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.1}
                    disabled={connected.has("timestamp-0")}
                />
            </div>

            {/* Output Preview */}
            {nodeData.outputUrl && (
                <img src={nodeData.outputUrl} alt="Frame" className="media-preview mt-2" />
            )}
        </BaseNode>
    );
}

export const ExtractFrameNode = memo(ExtractFrameNodeComponent);
