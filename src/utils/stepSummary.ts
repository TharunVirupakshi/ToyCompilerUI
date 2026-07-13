import type {
  LexReadTokenData,
  ParseAddSymData,
  ParseAssgnSymType,
  ParseCreateASTNodeData,
  ParseCreateScopeData,
  ParseEnterExitScopeData,
  ParseEnteringState,
  ParseErrorData,
  ParseReduceRuleData,
  ParseSemanticStepData,
  SemanticAnalysisCompleteData,
  SemanticErrorData,
  SemanticNodeHighlightData,
  SemanticPassStatusData,
  SemanticSymbolHighlightData,
  ICGCreateLabelData,
  ICGCreateTempData,
  ICGEmitData,
  ICGFunctionData,
  ICGListEventData,
  ICGNodeVisitData,
  ICGPatchLabelData,
  ICGCompleteData,
  Step,
} from "../types/steps";

export const getStepSummary = (step: Step): string => {
  switch (step.type) {
    case "LEX_READ_TOKEN": {
      const { token, value, location } = step.data as LexReadTokenData;
      return `LEX: ${token}${value ? `(${value})` : ""} @ ${location}`;
    }

    case "PARSE_REDUCE_RULE": {
      const { ruleNo, rule } = step.data as ParseReduceRuleData;
      return `REDUCE: ${rule} [${ruleNo}]`;
    }

    case "PARSE_SEMANTIC_STEP": {
      const { instr, stepNo } = step.data as ParseSemanticStepData;
      return `SEMANTIC(${stepNo}): ${instr}`;
    }

    case "PARSE_CREATE_AST_NODE":
      return `AST NODE CREATED: #${(step.data as ParseCreateASTNodeData).node_id}`;

    case "PARSE_CREATE_SCOPE": {
      const { name, table_id, parent_id } = step.data as ParseCreateScopeData;
      return `SCOPE CREATE: ${name} (id=${table_id}, parent=${parent_id})`;
    }

    case "PARSE_ENTER_SCOPE": {
      const { name, table_id } = step.data as ParseEnterExitScopeData;
      return `ENTER SCOPE: ${name} (id=${table_id})`;
    }

    case "PARSE_EXIT_SCOPE": {
      const { name, table_id } = step.data as ParseEnterExitScopeData;
      return `EXIT SCOPE: ${name} (id=${table_id})`;
    }

    case "PARSE_ADD_SYM": {
      const data = step.data as ParseAddSymData;
      return `ADD SYMBOL: ${data.name} : ${data.sym_type} (scope ${data.scope_id})`;
    }

    case "PARSE_ASSGN_SYM_TYPE": {
      const data = step.data as ParseAssgnSymType;
      return `TYPE ASSIGN: ${data.name} ← ${data.sym_type}`;
    }

    case "PARSE_ENTERING_STATE": {
      const data = step.data as ParseEnteringState;
      return `ENTERING STATE: ${data.state}`;
    }

    case "PARSE_ERROR": {
      const data = step.data as ParseErrorData;
      return `${data.message} at line ${data.line_no}, char ${data.char_no}`;
    }

    case "SEMANTIC_PASS_STATUS": {
      const data = step.data as SemanticPassStatusData;
      return `${data.message} (${data.pass})`;
    }

    case "SEMANTIC_SYMBOL_HIGHLIGHT": {
      const data = step.data as SemanticSymbolHighlightData;
      return `SYMBOL ${data.reason}: ${data.symbol_name} (scope ${data.scope_id})`;
    }

    case "SEMANTIC_NODE_HIGHLIGHT": {
      const data = step.data as SemanticNodeHighlightData;
      return `${data.action} NODE: ${data.node_type} #${data.node_id}`;
    }

    case "SEMANTIC_ERROR": {
      const data = step.data as SemanticErrorData;
      return `SEMANTIC ERROR: ${data.message}`;
    }

    case "SEMANTIC_ANALYSIS_COMPLETE": {
      const data = step.data as SemanticAnalysisCompleteData;
      return `SEMANTIC ${data.status}: ${data.total_errors} errors`;
    }

    case "ICG_NODE_VISIT": {
      const data = step.data as ICGNodeVisitData;
      return `LOWER NODE: ${data.node_type}${data.operator ? ` (${data.operator})` : ""}`;
    }

    case "ICG_CREATE_TEMP":
      return `CREATE TEMP: ${(step.data as ICGCreateTempData).temp_name}`;

    case "ICG_CREATE_LABEL":
      return `CREATE LABEL: ${(step.data as ICGCreateLabelData).label_name}`;

    case "ICG_EMIT":
      return `EMIT: ${(step.data as ICGEmitData).text}`;

    case "ICG_PATCH_LABEL": {
      const data = step.data as ICGPatchLabelData;
      return `PATCH #${data.instruction_no}: ${data.text}`;
    }

    case "ICG_LIST_CREATE": {
      const data = step.data as ICGListEventData;
      return `CREATE ${data.list_type}: ${data.instructions ?? "empty"}`;
    }

    case "ICG_LIST_MERGE": {
      const data = step.data as ICGListEventData;
      return `MERGE ${data.list_type}: ${data.result ?? "empty"}`;
    }

    case "ICG_BACKPATCH": {
      const data = step.data as ICGListEventData;
      return `BACKPATCH ${data.list_type}: ${data.instructions ?? "empty"} -> ${data.label_name ?? data.target_tac_id}`;
    }

    case "ICG_ENTER_FUNCTION":
    case "ICG_EXIT_FUNCTION": {
      const data = step.data as ICGFunctionData;
      return `${step.type === "ICG_ENTER_FUNCTION" ? "ENTER" : "EXIT"} FUNCTION: ${data.function_name}`;
    }

    case "ICG_COMPLETE": {
      const data = step.data as ICGCompleteData;
      return `ICG ${data.status}: ${data.instruction_count} instructions`;
    }

    default:
      return step.type;
  }
};
