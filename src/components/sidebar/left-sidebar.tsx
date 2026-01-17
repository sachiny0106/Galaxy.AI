"use client";
import { useState } from "react";
import {
    Type,
    Image,
    Video,
    Brain,
    Crop,
    Film,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { NodeType, NodeTypeValue } from "@/types/workflow";

const NODE_BUTTONS = [
    { type: NodeType.TEXT, icon: Type, label: "Text" },
    { type: NodeType.UPLOAD_IMAGE, icon: Image, label: "Upload Image" },
    { type: NodeType.UPLOAD_VIDEO, icon: Video, label: "Upload Video" },
    { type: NodeType.LLM, icon: Brain, label: "Run LLM" },
    { type: NodeType.CROP_IMAGE, icon: Crop, label: "Crop Image" },
    { type: NodeType.EXTRACT_FRAME, icon: Film, label: "Extract Frame" },
];

export function LeftSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState("");
    const addNode = useWorkflowStore((s) => s.addNode);

    const filtered = NODE_BUTTONS.filter((btn) =>
        btn.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddNode = (type: NodeTypeValue) => {
        const x = 100 + Math.random() * 200;
        const y = 100 + Math.random() * 200;
        addNode(type, { x, y });
    };

    return (
        <div className={`sidebar ${collapsed ? "collapsed" : ""}`} style={{ width: collapsed ? 60 : 240 }}>
            <div className="sidebar-header">
                {!collapsed && <span style={{ fontWeight: 600, fontSize: 14 }}>Nodes</span>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        marginLeft: collapsed ? 0 : "auto",
                    }}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {!collapsed && (
                <div style={{ padding: "12px 12px 0" }}>
                    <div style={{ position: "relative" }}>
                        <Search
                            size={14}
                            style={{
                                position: "absolute",
                                left: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)",
                            }}
                        />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search nodes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 32 }}
                        />
                    </div>
                </div>
            )}

            <div className="sidebar-content" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((btn) => (
                    <button
                        key={btn.type}
                        className="node-btn"
                        onClick={() => handleAddNode(btn.type)}
                        title={btn.label}
                    >
                        <btn.icon className="node-btn-icon" size={18} />
                        {!collapsed && <span>{btn.label}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
