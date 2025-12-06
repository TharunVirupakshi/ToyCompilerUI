export type StepType =
  | "PARSE_CREATE_SCOPE"
  | "PARSE_REDUCE_RULE"
  | "LEX_READ_TOKEN"
  | "PARSE_ADD_SYM"
  | "PARSE_ASSGN_SYM_TYPE"
  | "PARSE_ENTER_SCOPE"
  | "PARSE_EXIT_SCOPE";

export interface ParseCreateScopeData {
  table_id: string;
  name: string;
  parent_id: string;
}

export type NumericValue = number | string;

export interface ParseReduceRuleData {
  ruleId: NumericValue;
  subRuleId: NumericValue;
  rule: string;
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

export type ParseStepData =
  | ParseCreateScopeData
  | ParseReduceRuleData
  | LexReadTokenData
  | ParseAddSymData
  | ParseAssgnSymType
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
  ruleId?: number;
  subRuleId?: number;
};

