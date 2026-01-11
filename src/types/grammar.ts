export interface SemanticStep {
  stepNo: number;
  instr: string;
}
export interface GrammarRule {
  ruleNo: number;
  text: string;
  semanticSteps: SemanticStep[];
}
