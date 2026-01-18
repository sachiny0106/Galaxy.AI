import { ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useWorkflowStore } from "@/store/workflow-store";

interface BaseNodeProps {
    id: string;
    title: string;
    icon: LucideIcon;
    children: ReactNode;
    selected?: boolean;
    handles?: {
        type: "source" | "target";
        position: Position;
        id: string;
        dataType?: "text" | "image" | "video";
    }[];
}

export function BaseNode({ id, title, icon: Icon, children, selected, handles = [] }: BaseNodeProps) {
    const isExecuting = useWorkflowStore((s) => s.executingNodes.has(id));

    return (
        <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                borderColor: selected ? "var(--accent)" : isExecuting ? "var(--accent)" : "var(--node-border)",
                boxShadow: isExecuting
                    ? "0 0 0 2px rgba(124, 58, 237, 0.4), 0 0 20px rgba(124, 58, 237, 0.2)"
                    : selected
                        ? "0 0 0 2px var(--accent-glow)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="workflow-node relative w-72 bg-[#09090b] rounded-xl border border-zinc-800"
            style={{
                boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.3)"
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50">
                <Icon size={15} className="text-zinc-500" />
                <span className="text-[13px] font-medium text-zinc-300">{title}</span>
                {isExecuting && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500"
                    >
                        <div className="w-full h-full rounded-full bg-violet-500 animate-ping opacity-75" />
                    </motion.div>
                )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                {children}
            </div>

            {/* Handles */}
            {handles.map((h) => (
                <Handle
                    key={`${h.id}-${h.type}`}
                    type={h.type}
                    position={h.position}
                    id={h.id}
                />
            ))}
        </motion.div>
    );
}
