export type StepType =
  | "PARSE_CREATE_SCOPE"
  | "PARSE_REDUCE_RULE"
  | "PARSE_REDUCE_RULE_COMPLETE"
  | "PARSE_SEMANTIC_STEP"
  | "LEX_READ_TOKEN"
  | "PARSE_ADD_SYM"
  | "PARSE_ASSGN_SYM_TYPE"
  | "PARSE_ENTER_SCOPE"
  | "PARSE_CREATE_AST_NODE"
  | "PARSE_ENTERING_STATE"
  | "PARSE_STACK_SNAPSHOT"
  | "PARSE_EXIT_SCOPE"
  | "PARSE_ERROR"
  | "SEMANTIC_PASS_STATUS"
  | "SEMANTIC_SYMBOL_HIGHLIGHT"
  | "SEMANTIC_NODE_HIGHLIGHT"
  | "SEMANTIC_ERROR"
  | "SEMANTIC_ANALYSIS_COMPLETE"
  | "ICG_NODE_VISIT"
  | "ICG_CREATE_TEMP"
  | "ICG_CREATE_LABEL"
  | "ICG_EMIT"
  | "ICG_PATCH_LABEL"
  | "ICG_LIST_CREATE"
  | "ICG_LIST_MERGE"
  | "ICG_BACKPATCH"
  | "ICG_ENTER_FUNCTION"
  | "ICG_EXIT_FUNCTION"
  | "ICG_COMPLETE";

export type PhaseName = "PHASE_LEX_PARSE" | "PHASE_SEMANTIC" | "PHASE_ICG";

export const PHASE_ORDER: PhaseName[] = [
  "PHASE_LEX_PARSE",
  "PHASE_SEMANTIC",
  "PHASE_ICG",
];

export const PHASE_LABELS: Record<PhaseName, string> = {
  PHASE_LEX_PARSE: "LEX PARSE",
  PHASE_SEMANTIC: "SEMANTIC",
  PHASE_ICG: "ICG",
};

export const isKnownPhaseName = (phaseName: string): phaseName is PhaseName =>
  PHASE_ORDER.includes(phaseName as PhaseName);

export interface ParseErrorData {
  message: string;
  line_no: string;
  char_no: string;
}
export interface ParseCreateScopeData {
  table_id: string;
  name: string;
  parent_id: string;
}

export type NumericValue = number | string;

export interface ParseReduceRuleData {
  ruleNo: NumericValue;
  rule: string;
}

export interface ParseReduceRuleCompleteData {
  ruleNo: NumericValue;
  lhs: string;
  rhsLength: NumericValue;
}

export interface ParseStackSnapshot {
  states: number[];
  size: number;
}

export interface ParseEnteringState {
  state: number
}

export interface ParseSemanticStepData {
  ruleNo: NumericValue;
  stepNo: NumericValue;
  instr: string;
}

export interface LexReadTokenData {
  token: string;
  value: string;
  location: string;
}

export interface ParseAddSymData {
  name: string;
  sym_type: string;
  scope_id: string;
  is_function: string;
  line_no: string;
  char_no: string;
  is_duplicate: string;
}

export interface ParseAssgnSymType {
  name: string;
  sym_type: string;
  scope_id: string;
}

export interface ParseEnterExitScopeData {
  table_id: string;
  name: string;
}

export interface ParseCreateASTNodeData {
  node_id: NumericValue;
}

export interface SemanticPassStatusData {
  pass: string;
  status: string;
  message: string;
}

export interface SemanticSymbolHighlightData {
  scope_id: string;
  symbol_name: string;
  reason: string;
  old_type?: string;
  new_type?: string;
  line_no?: string;
  char_no?: string;
}

export interface SemanticNodeHighlightData {
  pass: string;
  node_id: string;
  node_type: string;
  line_no: string;
  char_no: string;
  action: string;
  message?: string;
}

export interface SemanticErrorData {
  pass: string;
  message: string;
  line_no: string;
  char_no: string;
  node_id?: string;
  scope_id?: string;
  symbol_name?: string;
}

export interface SemanticAnalysisCompleteData {
  status: string;
  total_errors: string;
}

export interface ICGOriginData {
  ast_node_id: NumericValue;
  node_type: string;
  line_no: NumericValue;
  char_no: NumericValue;
}

export interface ICGNodeVisitData extends ICGOriginData {
  action: string;
  operator?: string;
}

export interface ICGCreateTempData extends ICGOriginData {
  temp_name: string;
}

export interface ICGCreateLabelData extends ICGOriginData {
  label_name: string;
  target_tac_id: NumericValue;
}

export interface ICGEmitData extends ICGOriginData {
  instruction_no: NumericValue;
  source_tac_id: NumericValue;
  opcode: string;
  result: string;
  arg1: string;
  arg2: string;
  target_label: string;
  text: string;
}

export interface ICGPatchLabelData extends ICGOriginData {
  instruction_no: NumericValue;
  label_name: string;
  text: string;
}

export interface ICGListEventData extends ICGOriginData {
  list_type: string;
  instructions?: string;
  left?: string;
  right?: string;
  result?: string;
  target_tac_id?: NumericValue;
  label_name?: string;
}

export interface ICGFunctionData extends ICGOriginData {
  function_name: string;
}

export interface ICGCompleteData {
  status: string;
  instruction_count: NumericValue;
  temporary_count: NumericValue;
  label_count: NumericValue;
}

export type ParseStepData =
  | ParseCreateScopeData
  | ParseReduceRuleData
  | ParseReduceRuleCompleteData
  | ParseSemanticStepData
  | LexReadTokenData
  | ParseAddSymData
  | ParseErrorData
  | ParseAssgnSymType
  | ParseCreateASTNodeData
  | ParseEnteringState
  | ParseStackSnapshot
  | ParseEnterExitScopeData
  | SemanticPassStatusData
  | SemanticSymbolHighlightData
  | SemanticNodeHighlightData
  | SemanticErrorData
  | SemanticAnalysisCompleteData
  | ICGNodeVisitData
  | ICGCreateTempData
  | ICGCreateLabelData
  | ICGEmitData
  | ICGPatchLabelData
  | ICGListEventData
  | ICGFunctionData
  | ICGCompleteData;

export interface Step {
  type: StepType;
  data: ParseStepData;
}

export interface Phase {
  phase: string;
  steps: Step[];
}

export interface StepsData {
  phases: Phase[];
}

export type ActiveRule = {
  ruleNo: number;
};
