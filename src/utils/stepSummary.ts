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

    default:
      return step.type;
  }
};
