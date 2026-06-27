import type {
  SemanticAnalysisCompleteData,
  SemanticErrorData,
  SemanticNodeHighlightData,
  SemanticPassStatusData,
  SemanticSymbolHighlightData,
  Step,
} from "../types/steps";

export type SemanticPassState = "Not started" | "Running" | "Complete";
export type SemanticActivityTone = "info" | "pass" | "success" | "error";

export interface SemanticActivityEntry {
  stepIndex: number;
  tone: SemanticActivityTone;
  icon: "▶" | "•" | "✓" | "❌";
  message: string;
  detail?: string;
}

export interface SemanticSymbolFocus {
  scopeId: number;
  symbolName: string;
  reason: string;
  line?: number;
  char?: number;
}

export interface SemanticSourceHighlight {
  line: number;
  char: number;
  kind: "activity" | "error";
  message?: string;
}

export interface SemanticPlaybackState {
  currentPass: string | null;
  passState: SemanticPassState;
  activity: SemanticActivityEntry[];
  activeNodeId: number | null;
  symbolFocus: SemanticSymbolFocus | null;
  sourceHighlight: SemanticSourceHighlight | null;
  analysisResult: SemanticAnalysisCompleteData | null;
}

const toPositiveNumber = (value: string | number | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const formatSemanticName = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const sourceHighlightFrom = (
  data: { line_no?: string; char_no?: string },
  kind: SemanticSourceHighlight["kind"],
  message?: string
): SemanticSourceHighlight | null => {
  const line = toPositiveNumber(data.line_no);
  const char = toPositiveNumber(data.char_no);
  return line !== null && char !== null
    ? { line, char, kind, message }
    : null;
};

const formatSymbolActivity = (data: SemanticSymbolHighlightData) => {
  switch (data.reason.toUpperCase()) {
    case "DUPLICATE":
      return `Symbol "${data.symbol_name}" marked duplicate`;
    case "RESOLVED":
      return `Symbol "${data.symbol_name}" resolved`;
    case "TYPE_UPDATE":
      if (data.old_type && data.new_type && data.old_type !== data.new_type) {
        return `Symbol "${data.symbol_name}" type updated: ${data.old_type} → ${data.new_type}`;
      }
      if (data.new_type) {
        return `Symbol "${data.symbol_name}" type validated as ${data.new_type}`;
      }
      return `Symbol "${data.symbol_name}" type updated`;
    default:
      return `Symbol "${data.symbol_name}": ${formatSemanticName(data.reason)}`;
  }
};

const splitErrorMessage = (message: string) => {
  const separatorIndex = message.indexOf(":");
  if (separatorIndex < 0) {
    return { message };
  }

  return {
    message: `${message.slice(0, separatorIndex).trim()}:`,
    detail: message.slice(separatorIndex + 1).trim(),
  };
};

export const deriveSemanticPlaybackState = (
  steps: Step[],
  currentStepIndex: number
): SemanticPlaybackState => {
  const state: SemanticPlaybackState = {
    currentPass: null,
    passState: "Not started",
    activity: [],
    activeNodeId: null,
    symbolFocus: null,
    sourceHighlight: null,
    analysisResult: null,
  };

  const upperBound = Math.min(currentStepIndex, steps.length - 1);
  if (upperBound < 0) {
    return state;
  }

  steps.slice(0, upperBound + 1).forEach((step, stepIndex) => {
    switch (step.type) {
      case "SEMANTIC_PASS_STATUS": {
        const data = step.data as SemanticPassStatusData;
        const isComplete = data.status.toUpperCase() === "COMPLETE";
        state.currentPass = data.pass;
        state.passState = isComplete ? "Complete" : "Running";
        state.activity.push({
          stepIndex,
          tone: isComplete ? "success" : "pass",
          icon: isComplete ? "✓" : "▶",
          message: isComplete
            ? `Completed pass: ${formatSemanticName(data.pass)}`
            : `Starting pass: ${formatSemanticName(data.pass)}`,
        });
        break;
      }
      case "SEMANTIC_NODE_HIGHLIGHT": {
        const data = step.data as SemanticNodeHighlightData;
        const isError = data.action.toUpperCase() === "ERROR";
        const nodeId = Number(data.node_id);
        if (Number.isFinite(nodeId)) {
          state.activeNodeId = nodeId;
        }
        state.activity.push({
          stepIndex,
          tone: isError ? "error" : "info",
          icon: isError ? "❌" : "•",
          message: isError
            ? `Error at ${data.node_type}`
            : `Visiting ${data.node_type}`,
          detail: isError ? data.message : undefined,
        });
        state.sourceHighlight =
          sourceHighlightFrom(
            data,
            isError ? "error" : "activity",
            data.message
          ) ?? state.sourceHighlight;
        break;
      }
      case "SEMANTIC_SYMBOL_HIGHLIGHT": {
        const data = step.data as SemanticSymbolHighlightData;
        const scopeId = Number(data.scope_id);
        const line = toPositiveNumber(data.line_no);
        const char = toPositiveNumber(data.char_no);
        if (Number.isFinite(scopeId)) {
          state.symbolFocus = {
            scopeId,
            symbolName: data.symbol_name,
            reason: data.reason,
            line: line ?? undefined,
            char: char ?? undefined,
          };
        }
        state.activity.push({
          stepIndex,
          tone: data.reason.toUpperCase() === "DUPLICATE" ? "error" : "info",
          icon: data.reason.toUpperCase() === "DUPLICATE" ? "❌" : "•",
          message: formatSymbolActivity(data),
        });
        state.sourceHighlight =
          sourceHighlightFrom(data, "activity") ?? state.sourceHighlight;
        break;
      }
      case "SEMANTIC_ERROR": {
        const data = step.data as SemanticErrorData;
        const formatted = splitErrorMessage(data.message);
        state.activity.push({
          stepIndex,
          tone: "error",
          icon: "❌",
          message: formatted.message,
          detail: formatted.detail,
        });
        state.sourceHighlight =
          sourceHighlightFrom(data, "error", data.message) ??
          state.sourceHighlight;
        break;
      }
      case "SEMANTIC_ANALYSIS_COMPLETE": {
        const data = step.data as SemanticAnalysisCompleteData;
        const errorCount = Number(data.total_errors);
        const hasErrors =
          data.status.toUpperCase() === "ERROR" ||
          (Number.isFinite(errorCount) && errorCount > 0);
        state.analysisResult = data;
        state.activity.push({
          stepIndex,
          tone: hasErrors ? "error" : "success",
          icon: hasErrors ? "❌" : "✓",
          message: hasErrors
            ? `Semantic analysis completed with ${data.total_errors} error${
                data.total_errors === "1" ? "" : "s"
              }`
            : "Semantic analysis complete",
        });
        break;
      }
      default:
        break;
    }
  });

  return state;
};
