import type { StepsData } from "../types/steps";
import stepsJson from "./steps.json";
import astJson from "./ast.json";

export const sampleAstJson = astJson;
export const sampleStepsData: StepsData = stepsJson;
export const sampleInputCode = 
`int i = 2;

void main(){
  int j;
  i = 3;
  j = 1;
}`;