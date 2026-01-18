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

    const getHandleColor = (type?: "text" | "image" | "video") => {
        switch (type) {
            case "text": return "bg-blue-500";
            case "image": return "bg-violet-500";
            case "video": return "bg-pink-500";
            default: return "bg-zinc-400";
        }
    };

    return (
        <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                borderColor: selected ? "var(--accent)" : isExecuting ? "var(--accent)" : "var(--node-border)",
                boxShadow: isExecuting
                    ? "0 0 40px -5px rgba(124, 58, 237, 0.5)"
                    : selected
                        ? "0 0 0 2px var(--accent-glow)"
                        : "0 4px 20px rgba(0,0,0,0.2)"
            }}
            whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 15 } }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="workflow-node relative min-w-[280px] bg-[#18181b] rounded-xl border border-zinc-800"
            style={{
                // Explicitly set border here to override class styles if needed, but motion handles it
                borderWidth: 1
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-white/5 rounded-t-xl">
                <Icon size={16} className="text-violet-500" />
                <span className="text-sm font-semibold text-zinc-100 tracking-tight">{title}</span>
                {isExecuting && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 rounded-full bg-violet-500"
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
                    className={`
                        w-3 h-3 border-2 border-[#0a0a0a] transition-colors
                        ${getHandleColor(h.dataType)}
                    `}
                />
            ))}
        </motion.div>
    );
}
