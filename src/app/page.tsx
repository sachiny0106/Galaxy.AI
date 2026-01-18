"use client";
import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowCanvas } from "@/components/canvas";
import { LeftSidebar, RightSidebar } from "@/components/sidebar";
import { Toolbar } from "@/components/toolbar";
import { useWorkflowStore } from "@/store/workflow-store";
import { SAMPLE_WORKFLOW } from "@/lib/sample-workflow";

import { Menu, History } from "lucide-react";

function WorkflowEditor() {
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const nodes = useWorkflowStore((s) => s.nodes);
  const [initialized, setInitialized] = useState(false);

  // Mobile sidebar states
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  useEffect(() => {
    if (!initialized && nodes.length === 0) {
      setNodes(SAMPLE_WORKFLOW.nodes);
      setEdges(SAMPLE_WORKFLOW.edges);
      setInitialized(true);
    }
  }, [initialized, nodes.length, setNodes, setEdges]);

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col md:flex-row bg-black text-zinc-100">
      {/* Mobile Header */}
      <div className="md:hidden h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[var(--surface)] z-30 shrink-0">
        <button
          onClick={() => setLeftOpen(true)}
          className="p-2 -ml-2 text-zinc-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-sm tracking-wide">Galaxy.AI</span>
        <button
          onClick={() => setRightOpen(true)}
          className="p-2 -mr-2 text-zinc-400 hover:text-white"
        >
          <History size={20} />
        </button>
      </div>

      <LeftSidebar mobileOpen={leftOpen} onClose={() => setLeftOpen(false)} />

      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        <Toolbar />
        <div className="flex-1 relative w-full h-full">
          <WorkflowCanvas />
        </div>
      </main>

      <RightSidebar mobileOpen={rightOpen} onClose={() => setRightOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
