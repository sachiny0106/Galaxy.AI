"use client";
import { memo } from "react";
import { Position, NodeProps, Handle } from "@xyflow/react";
import { Crop } from "lucide-react";
import { CropImageNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { BaseNode } from "./base-node";

function CropImageNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as CropImageNodeData;
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
    const getConnectedInputs = useWorkflowStore((s) => s.getConnectedInputs);

    const connected = getConnectedInputs(id);
    const imageConnected = connected.has("image_url-0");

    const handleNumericChange = (field: string, value: string) => {
        const num = parseFloat(value) || 0;
        const clamped = Math.max(0, Math.min(100, num));
        updateNodeData(id, { [field]: clamped });
    };

    return (
        <BaseNode
            id={id}
            title={nodeData.label}
            icon={Crop}
            selected={selected}
            handles={[
                { type: "target", position: Position.Left, id: "image_url-0", dataType: "image" },
                { type: "source", position: Position.Right, id: "image_url-0", dataType: "image" }
            ]}
        >
            {/* Image Input Info */}
            <div className={`text-xs mb-2 ${imageConnected ? "text-green-500" : "text-zinc-500"}`}>
                Image: {imageConnected ? "✓ Connected" : "⚠ Not connected"}
            </div>

            {/* Crop Parameters */}
            <div className="grid grid-cols-2 gap-2 relative">
                {["xPercent", "yPercent", "widthPercent", "heightPercent"].map((field, i) => (
                    <div key={field} className="relative group">
                        {/* Hidden handle for connection logic */}
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`${field}-0`}
                            className="!w-2 !h-2 !-left-3 !bg-zinc-600"
                            style={{ top: '65%' }}
                        />
                        <label className="text-[10px] text-zinc-500 block uppercase flex items-center gap-1">
                            {field.replace("Percent", "%")}
                            {connected.has(`${field}-0`) && <div className="w-1 h-1 rounded-full bg-violet-500" />}
                        </label>
                        <input
                            type="number"
                            className={`input-field py-1 px-2 ${connected.has(`${field}-0`) ? "opacity-50 cursor-not-allowed bg-zinc-900/50" : ""}`}
                            value={nodeData[field as keyof CropImageNodeData] as number}
                            onChange={(e) => handleNumericChange(field, e.target.value)}
                            min={0}
                            max={100}
                            disabled={connected.has(`${field}-0`)}
                        />
                    </div>
                ))}
            </div>

            {/* Output Preview */}
            {nodeData.outputUrl && (
                <img src={nodeData.outputUrl} alt="Cropped" className="media-preview mt-2" />
            )}
        </BaseNode>
    );
}

export const CropImageNode = memo(CropImageNodeComponent);
