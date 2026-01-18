"use client";
import { memo } from "react";
import { Position, NodeProps } from "@xyflow/react";
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
            <div className="grid grid-cols-2 gap-2">
                {["xPercent", "yPercent", "widthPercent", "heightPercent"].map((field) => (
                    <div key={field}>
                        <label className="text-[10px] text-zinc-500 block uppercase">{field.replace("Percent", "%")}</label>
                        <input
                            type="number"
                            className="input-field py-1 px-2"
                            value={nodeData[field as keyof CropImageNodeData] as number}
                            onChange={(e) => handleNumericChange(field, e.target.value)}
                            min={0}
                            max={100}
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
