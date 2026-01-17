"use client";
import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";

export function AnimatedEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: "var(--accent)",
                    strokeWidth: 2,
                }}
            />
            <path
                d={edgePath}
                fill="none"
                stroke="var(--accent-light)"
                strokeWidth={2}
                strokeDasharray="5 5"
                className="animated-edge"
                style={{ opacity: 0.8 }}
            />
        </>
    );
}
