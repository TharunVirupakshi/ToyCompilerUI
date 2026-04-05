import type { Step } from "../types/steps";

export interface ParseVisibleTimeline {
  visibleSteps: Step[];
  visibleToRawIndex: number[];
  rawToVisibleIndex: Array<number | null>;
  currentVisibleStepIndex: number;
  currentRawStepIndex: number;
  isAtStart: boolean;
  isAtEnd: boolean;
}

const isSemanticSubstep = (step: Step) => step.type === "PARSE_SEMANTIC_STEP";

export const deriveParseVisibleTimeline = (
  rawSteps: Step[],
  showSemanticRules: boolean,
  currentVisibleStepIndex: number
): ParseVisibleTimeline => {
  const visibleSteps: Step[] = [];
  const visibleToRawIndex: number[] = [];
  const rawToVisibleIndex = Array<number | null>(rawSteps.length).fill(null);

  rawSteps.forEach((step, rawIndex) => {
    if (!showSemanticRules && isSemanticSubstep(step)) {
      return;
    }

    rawToVisibleIndex[rawIndex] = visibleSteps.length;
    visibleSteps.push(step);
    visibleToRawIndex.push(rawIndex);
  });

  const currentVisible =
    currentVisibleStepIndex < 0
      ? -1
      : Math.min(currentVisibleStepIndex, visibleSteps.length - 1);

  const currentRawStepIndex =
    currentVisible >= 0 ? (visibleToRawIndex[currentVisible] ?? -1) : -1;

  return {
    visibleSteps,
    visibleToRawIndex,
    rawToVisibleIndex,
    currentVisibleStepIndex: currentVisible,
    currentRawStepIndex,
    isAtStart: currentVisible <= 0,
    isAtEnd: currentVisible >= visibleSteps.length - 1,
  };
};

export const findVisibleIndexForRawIndex = (
  rawIndex: number,
  visibleToRawIndex: number[]
) => {
  if (rawIndex < 0 || visibleToRawIndex.length === 0) {
    return -1;
  }

  const exactMatch = visibleToRawIndex.indexOf(rawIndex);
  if (exactMatch !== -1) {
    return exactMatch;
  }

  const nextVisibleIndex = visibleToRawIndex.findIndex((visibleRawIndex) => visibleRawIndex > rawIndex);
  if (nextVisibleIndex !== -1) {
    return nextVisibleIndex;
  }

  return visibleToRawIndex.length - 1;
};
