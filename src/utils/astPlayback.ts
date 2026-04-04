import type { ParseCreateASTNodeData, Step } from "../types/steps";

export const deriveAstNodeIds = (steps: Step[], uptoIndex: number) => {
  if (uptoIndex < 0) {
    return [];
  }

  const upperBound = Math.min(uptoIndex, steps.length - 1);
  const nodeIds: number[] = [];

  for (const step of steps.slice(0, upperBound + 1)) {
    if (step.type !== "PARSE_CREATE_AST_NODE") {
      continue;
    }

    const nodeId = Number((step.data as ParseCreateASTNodeData).node_id);
    if (!Number.isNaN(nodeId)) {
      nodeIds.push(nodeId);
    }
  }

  return nodeIds;
};
