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
  | "PARSE_EXIT_SCOPE";

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

export type ParseStepData =
  | ParseCreateScopeData
  | ParseReduceRuleData
  | ParseReduceRuleCompleteData
  | ParseSemanticStepData
  | LexReadTokenData
  | ParseAddSymData
  | ParseAssgnSymType
  | ParseCreateASTNodeData
  | ParseEnteringState
  | ParseStackSnapshot
  | ParseEnterExitScopeData;

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

