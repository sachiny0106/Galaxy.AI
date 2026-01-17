"use client";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowCanvas } from "@/components/canvas";
import { LeftSidebar, RightSidebar } from "@/components/sidebar";

export default function Home() {
  return (
    <ReactFlowProvider>
      <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
        <LeftSidebar />
        <main style={{ flex: 1, position: "relative" }}>
          <WorkflowCanvas />
        </main>
        <RightSidebar />
      </div>
    </ReactFlowProvider>
  );
}
