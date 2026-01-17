"use client";
import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowCanvas } from "@/components/canvas";
import { LeftSidebar, RightSidebar } from "@/components/sidebar";
import { Toolbar } from "@/components/toolbar";
import { useWorkflowStore } from "@/store/workflow-store";
import { createSampleWorkflow } from "@/lib/sample-workflow";

function WorkflowEditor() {
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const nodes = useWorkflowStore((s) => s.nodes);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && nodes.length === 0) {
      const sample = createSampleWorkflow();
      setNodes(sample.nodes);
      setEdges(sample.edges);
      setInitialized(true);
    }
  }, [initialized, nodes.length, setNodes, setEdges]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <LeftSidebar />
      <main style={{ flex: 1, position: "relative" }}>
        <Toolbar />
        <WorkflowCanvas />
      </main>
      <RightSidebar />
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
