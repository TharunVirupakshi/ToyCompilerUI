import type { ParseCreateASTNodeData, Step } from "../types/steps";

export interface ASTPlaybackState {
  visibleNodeIds: number[];
  focusNodeId: number | null;
}

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

export const deriveASTPlaybackState = (
  steps: Step[],
  uptoIndex: number
): ASTPlaybackState => {
  const visibleNodeIds = deriveAstNodeIds(steps, uptoIndex);

  if (uptoIndex < 0 || uptoIndex >= steps.length) {
    return {
      visibleNodeIds,
      focusNodeId: null,
    };
  }

  const currentStep = steps[uptoIndex];
  const focusNodeId =
    currentStep?.type === "PARSE_CREATE_AST_NODE"
      ? Number((currentStep.data as ParseCreateASTNodeData).node_id)
      : null;

  return {
    visibleNodeIds,
    focusNodeId: Number.isNaN(focusNodeId ?? NaN) ? null : focusNodeId,
  };
};
