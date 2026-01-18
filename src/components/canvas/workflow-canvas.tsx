"use client";
import { useCallback } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    Connection,
    NodeTypes,
    EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "@/store/workflow-store";
import { useHistoryStore } from "@/store/history-store";
import { NodeType } from "@/types/workflow";
import {
    TextNode,
    UploadImageNode,
    UploadVideoNode,
    LlmNode,
    CropImageNode,
    ExtractFrameNode,
} from "@/components/nodes";
import { AnimatedEdge } from "./animated-edge";

const nodeTypes: NodeTypes = {
    [NodeType.TEXT]: TextNode,
    [NodeType.UPLOAD_IMAGE]: UploadImageNode,
    [NodeType.UPLOAD_VIDEO]: UploadVideoNode,
    [NodeType.LLM]: LlmNode,
    [NodeType.CROP_IMAGE]: CropImageNode,
    [NodeType.EXTRACT_FRAME]: ExtractFrameNode,
};

const edgeTypes: EdgeTypes = {
    animated: AnimatedEdge,
};

const defaultEdgeOptions = {
    type: "animated",
    animated: true,
};

export function WorkflowCanvas() {
    const nodes = useWorkflowStore((s) => s.nodes);
    const edges = useWorkflowStore((s) => s.edges);
    const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
    const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
    const onConnect = useWorkflowStore((s) => s.onConnect);
    const selectNode = useWorkflowStore((s) => s.selectNode);
    const isHistoryMode = useHistoryStore((s) => s.isHistoryMode);

    const handleConnect = useCallback(
        (conn: Connection) => {
            onConnect(conn);
        },
        [onConnect]
    );

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: { id: string }) => {
            selectNode(node.id);
        },
        [selectNode]
    );

    const handlePaneClick = useCallback(() => {
        selectNode(null);
    }, [selectNode]);

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={isHistoryMode ? undefined : onNodesChange}
                onEdgesChange={isHistoryMode ? undefined : onEdgesChange}
                onConnect={isHistoryMode ? undefined : handleConnect}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                nodesDraggable={!isHistoryMode}
                nodesConnectable={!isHistoryMode}
                elementsSelectable={!isHistoryMode}
                panOnScroll
                selectionOnDrag
                panOnDrag={[1, 2]}
                zoomOnScroll
                zoomOnPinch
                minZoom={0.1}
                maxZoom={2}
                connectionRadius={80} // Make it easier to snap connections
                connectionLineStyle={{
                    stroke: "var(--accent)",
                    strokeWidth: 3,
                    strokeDasharray: "5 5",
                }}
                deleteKeyCode={["Backspace", "Delete"]}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#3f3f46"
                    style={{ opacity: 0.2 }}
                />
                <Controls
                    position="bottom-left"
                    showInteractive={false}
                    showFitView={false}
                />
                <MiniMap
                    position="bottom-right"
                    nodeColor="var(--accent)"
                    maskColor="rgba(0, 0, 0, 0.8)"
                    style={{
                        background: "var(--bg-secondary)",
                    }}
                />
            </ReactFlow>
        </div>
    );
}
