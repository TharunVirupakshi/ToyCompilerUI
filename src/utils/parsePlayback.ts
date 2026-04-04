import type {
  ActiveRule,
  LexReadTokenData,
  ParseEnteringState,
  ParseReduceRuleCompleteData,
  ParseReduceRuleData,
  ParseSemanticStepData,
  ParseStackSnapshot,
  Step,
} from "../types/steps";

export interface ParserStackSymbol {
  displayValue: string;
  value: string;
}

export interface ParsePlaybackState {
  visibleStepIndex: number;
  activeRule: ActiveRule | null;
  activeSemanticStep: ParseSemanticStepData | null;
  stateStack: number[];
  symbolStack: ParserStackSymbol[];
  reduceCount: number;
  reduceLhs: string | null;
  lookahead: ParserStackSymbol | null;
  highlightReduce: boolean;
  highlightReduceComplete: boolean;
  enteringState: number | null;
}

const isSemanticStep = (step: Step | undefined) => step?.type === "PARSE_SEMANTIC_STEP";

const normalizeStepIndex = (
  steps: Step[],
  currentStepIndex: number,
  showSemanticRules: boolean
) => {
  if (currentStepIndex < 0 || steps.length === 0) {
    return currentStepIndex;
  }

  let index = currentStepIndex;

  if (!showSemanticRules) {
    while (index < steps.length && isSemanticStep(steps[index])) {
      index += 1;
    }
  }

  if (index >= steps.length) {
    return steps.length - 1;
  }

  return index;
};

const getRhsLength = (ruleText: string) => {
  const rhs = ruleText.split("→")[1]?.trim();
  if (!rhs || rhs === "ε") return 0;
  return rhs.split(/\s+/).length;
};

const deriveLookahead = (data: LexReadTokenData): ParserStackSymbol | null => {
  switch (data.token) {
    case "READ_CHARACTER":
      return { displayValue: data.value, value: `'${data.value}'` };
    case "KEYWORD":
    case "OPERATOR":
      return { displayValue: data.value, value: data.value };
    case "ID":
    case "INT_LITERAL":
    case "STR_LITERAL":
    case "CHAR_LITERAL":
      return { displayValue: `${data.token}(${data.value})`, value: data.token };
    default:
      return null;
  }
};

export const deriveParsePlaybackState = (
  steps: Step[],
  currentStepIndex: number,
  showSemanticRules: boolean
): ParsePlaybackState => {
  const visibleStepIndex = normalizeStepIndex(steps, currentStepIndex, showSemanticRules);

  const state: ParsePlaybackState = {
    visibleStepIndex,
    activeRule: null,
    activeSemanticStep: null,
    stateStack: [],
    symbolStack: [],
    reduceCount: 0,
    reduceLhs: null,
    lookahead: null,
    highlightReduce: false,
    highlightReduceComplete: false,
    enteringState: null,
  };

  if (visibleStepIndex < 0) {
    return state;
  }

  for (const step of steps.slice(0, visibleStepIndex + 1)) {
    switch (step.type) {
      case "LEX_READ_TOKEN": {
        const nextLookahead = deriveLookahead(step.data as LexReadTokenData);
        if (nextLookahead) {
          state.lookahead = nextLookahead;
        }
        break;
      }
      case "PARSE_REDUCE_RULE": {
        const data = step.data as ParseReduceRuleData;
        state.activeRule = { ruleNo: Number(data.ruleNo) };
        state.reduceCount = getRhsLength(data.rule);
        state.reduceLhs = data.rule.split("→")[0]?.trim() ?? null;
        state.highlightReduce = true;
        break;
      }
      case "PARSE_SEMANTIC_STEP": {
        if (showSemanticRules) {
          state.activeSemanticStep = step.data as ParseSemanticStepData;
        }
        break;
      }
      case "PARSE_REDUCE_RULE_COMPLETE": {
        const data = step.data as ParseReduceRuleCompleteData;
        const rhsLength = Number(data.rhsLength);

        state.reduceCount = 0;
        state.highlightReduce = false;
        state.highlightReduceComplete = true;
        state.stateStack = state.stateStack.slice(0, Math.max(0, state.stateStack.length - rhsLength));
        state.symbolStack = state.symbolStack.slice(0, Math.max(0, state.symbolStack.length - rhsLength));
        state.symbolStack.push({ displayValue: data.lhs, value: data.lhs });
        break;
      }
      case "PARSE_ENTERING_STATE": {
        const data = step.data as ParseEnteringState;
        state.enteringState = Number(data.state);
        break;
      }
      case "PARSE_STACK_SNAPSHOT": {
        const snapshot = step.data as ParseStackSnapshot;
        state.stateStack = snapshot.states.map(Number);

        if (state.stateStack.at(-1) === 1) {
          state.lookahead = { displayValue: "$end", value: "$end" };
        }

        if (state.highlightReduceComplete) {
          state.highlightReduceComplete = false;
          break;
        }

        if (state.lookahead) {
          state.symbolStack = [...state.symbolStack, state.lookahead];
          state.lookahead = null;
        }
        break;
      }
      default:
        break;
    }
  }

  return state;
};

export const getNextVisibleStepIndex = (
  steps: Step[],
  currentStepIndex: number,
  delta: -1 | 1,
  showSemanticRules: boolean
) => {
  let nextIndex = currentStepIndex + delta;

  while (
    nextIndex >= 0 &&
    nextIndex < steps.length &&
    !showSemanticRules &&
    isSemanticStep(steps[nextIndex])
  ) {
    nextIndex += delta;
  }

  if (nextIndex < 0 || nextIndex >= steps.length) {
    return null;
  }

  return nextIndex;
};
