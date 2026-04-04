import type { ParserState } from "../types/states";
import type { ParserStackSymbol } from "./parsePlayback";

export interface HighlightedParserAction {
  state: number;
  kind: "shift" | "goto" | "default" | null;
  index?: number;
}

export interface ParserStatesViewModel {
  activeState: number | null;
  topSymbol: ParserStackSymbol | null;
  highlightedAction: HighlightedParserAction | null;
}

export const deriveParserStatesView = (
  states: ParserState[],
  stateStack: number[],
  symbolStack: ParserStackSymbol[],
  lookahead: ParserStackSymbol | null,
  highlightReduce: boolean,
  highlightReduceComplete: boolean
): ParserStatesViewModel => {
  const activeState = stateStack.length > 0 ? stateStack[stateStack.length - 1] : null;
  const topSymbol = symbolStack.length > 0 ? symbolStack[symbolStack.length - 1] : null;

  if (activeState === null) {
    return {
      activeState: null,
      topSymbol,
      highlightedAction: null,
    };
  }

  const state = states.find((item) => item.state === activeState);
  if (!state) {
    return {
      activeState,
      topSymbol,
      highlightedAction: null,
    };
  }

  if (highlightReduce || highlightReduceComplete) {
    if (topSymbol) {
      const gotoIndex = state.gotos.findIndex((item) => item.symbol === topSymbol.value);
      if (gotoIndex !== -1) {
        return {
          activeState,
          topSymbol,
          highlightedAction: {
            state: activeState,
            kind: "goto",
            index: gotoIndex,
          },
        };
      }
    }

    return {
      activeState,
      topSymbol,
      highlightedAction: {
        state: activeState,
        kind: "default",
      },
    };
  }

  if (lookahead) {
    const shiftIndex = state.shifts.findIndex((item) => item.symbol === lookahead.value);
    if (shiftIndex !== -1) {
      return {
        activeState,
        topSymbol,
        highlightedAction: {
          state: activeState,
          kind: "shift",
          index: shiftIndex,
        },
      };
    }
  }

  if (state.default) {
    return {
      activeState,
      topSymbol,
      highlightedAction: {
        state: activeState,
        kind: "default",
      },
    };
  }

  return {
    activeState,
    topSymbol,
    highlightedAction: null,
  };
};
