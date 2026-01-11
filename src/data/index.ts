import type { StepsData } from "../types/steps";
import stepsJson from "./steps.json";
import astJson from "./ast.json";
import statesJson from "./states.json";
import grammarJsonData from "./grammar.json";
import type { GrammarRule } from "../types/grammar";

export const sampleAstJson = astJson;
export const sampleStepsData: StepsData = stepsJson;
export const sampleStatesJson = statesJson;
export const grammarJson: GrammarRule[] =  grammarJsonData;
export const sampleInputCode = 
`int i = 2;

void main(){
  int j;
  i = 3;
  j = 1;
}`;