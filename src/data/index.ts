import type { StepsData } from "../types/steps";
import type { ParserState } from "../types/states";
import type { ASTData } from "../components/ASTPane";
import stepsJson from "./steps.json";
import astJson from "./ast.json";
import statesJson from "./states.json";
import grammarJsonData from "./grammar.json";
import type { GrammarRule } from "../types/grammar";

export const sampleAstJson = astJson as ASTData;
export const sampleStepsData = stepsJson as StepsData;
export const sampleStatesJson = statesJson as ParserState[];
export const grammarJson = grammarJsonData as GrammarRule[];
export const sampleInputCode = 
`int i = 2;

int main() {
    return 0;
}
`;
