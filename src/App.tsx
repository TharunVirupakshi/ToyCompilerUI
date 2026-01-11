import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import EditorWindow from "./components/EditorWindow";
import GrammarPanel from "./components/GrammarPanel";
import ResizableLayout from "./components/ResizableLayout";
import SymbolTablesPane from "./components/SymbolTablesPane";
import StepTimeline from "./components/StepTimeline";
import InsightsPanel from "./components/InsightsPanel";
import { sampleStepsData, sampleAstJson, sampleStatesJson } from "./data";
import type { ActiveRule, ParseCreateASTNodeData, Step, StepsData, ParseSemanticStepData, ParseStackSnapshot } from "./types/steps";
import { deriveSymbolTableState } from "./utils/symbolTables";
import ASTPane from "./components/ASTPane";
import type { ASTPaneHandle } from "./components/ASTPane";
import ParserStatesPanel from "./components/ParserStatesPanel";

function App() {
  const [stepsData, setStepsData] = useState<StepsData>(sampleStepsData);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [activeRule, setActiveRule] = useState<ActiveRule | null>(null);
  const [logLabel, setLogLabel] = useState("Sample data");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSemanticRules, setShowSemanticRules] = useState<boolean>(false);
  const [activeSemanticStep, setActiveSemanticStep] = useState<ParseSemanticStepData | null>(null);
  const [parseStatesStack, setParseStatesStack] = useState<number[]>([]); 


  const steps = useMemo(() => stepsData.phases[0]?.steps ?? [], [stepsData]);
  const astRef = useRef<ASTPaneHandle>(null);

  const isSemanticStep = (step: Step | undefined) =>
    step?.type === "PARSE_SEMANTIC_STEP";

    useEffect(() => {
      if (currentStepIndex < 0 || steps.length === 0) return;
    
      let idx = currentStepIndex;
    
      // 🔁 Skip semantic steps if disabled
      if (!showSemanticRules) {
        while (idx < steps.length && isSemanticStep(steps[idx])) {
          idx++;
        }
      }
    
      // 🚨 Clamp
      if (idx >= steps.length) {
        idx = steps.length - 1;
      }
    
      // 🔄 Update index ONCE and EXIT
      if (idx !== currentStepIndex) {
        setCurrentStepIndex(idx);
        return; // 🔑 critical
      }
    
      const step = steps[idx];
      if (!step) return;
    
      // 🔥 Semantic highlighting
      if (showSemanticRules && isSemanticStep(step)) {
        const data = step.data as ParseSemanticStepData
        // console.log("Set semantic step ", data.instr)
        setActiveSemanticStep(data);
      } 
    
      // 🌳 AST node handling
      if (step.type === "PARSE_CREATE_AST_NODE") {
        const nodeId = Number(
          (step.data as ParseCreateASTNodeData)?.node_id
        );
        console.log("Enabling node: ", nodeId)
        if (!Number.isNaN(nodeId)) {
          astRef.current?.enableNode(nodeId);
        }
      }

      if (step.type == "PARSE_STACK_SNAPSHOT") {
        const statesStack = (step.data as ParseStackSnapshot)?.states
        setParseStatesStack(statesStack)
      }
    }, [steps, currentStepIndex, showSemanticRules]);
    
  

  const symbolTables = useMemo(() => {
    if (currentStepIndex < 0) {
      return { tables: [], focusId: null };
    }
    return deriveSymbolTableState(steps, currentStepIndex);
  }, [steps, currentStepIndex]);
  

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text) as StepsData;
        if (!parsed?.phases?.length) {
          throw new Error("Unexpected log format");
        }
        setStepsData(parsed);
        setCurrentStepIndex(0);
        setActiveRule(null);
        setLogLabel(file.name);
        setLoadError(null);
      })
      .catch(() => {
        setLoadError("Could not parse the selected log file.");
      })
      .finally(() => {
        event.target.value = "";
      });
  }, []);

  const handleUseSample = useCallback(() => {
    setStepsData(sampleStepsData);
    setCurrentStepIndex(0);
    setActiveRule(null);
    setLogLabel("Sample data");
    setLoadError(null);
  }, []);

  const totalSymbols = useMemo(
    () => symbolTables.tables.reduce((acc, table) => acc + table.symbols.length, 0),
    [symbolTables.tables]
  );

  return (
    <div className="app-root flex flex-col h-screen">
      <header className="app-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-brand">compiler ui</span>
          <span className="toolbar-file">{logLabel}</span>
          {loadError && <span className="text-muted">({loadError})</span>}
        </div>
        <div className="toolbar-actions">
        {currentStepIndex < 0 && (
          <button className="bg-neutral-600 rounded-sm p-1 px-3 font-mono font-light text-sm cursor-pointer" onClick={() => setCurrentStepIndex(0)}>
            START
          </button>
        )}
        <button
          className={`
            rounded-sm p-1 px-3 font-mono text-sm cursor-pointer
            ${showSemanticRules
              ? "bg-blue-600 text-white"
              : "bg-neutral-700 text-gray-300"}
          `}
          onClick={() => setShowSemanticRules(v => !v)}
        >
          {showSemanticRules ? "Semantic: ON" : "Semantic: OFF"}
        </button>
          <label className="file-input">
            Load log
            <input type="file" accept="application/json" onChange={handleFileUpload} />
          </label>
          <button className="bg-neutral-600 rounded-sm p-1 px-3 font-mono font-light text-sm cursor-pointer" onClick={handleUseSample}>
            Reset sample
          </button>
        </div>
      </header>
      <main className="workspace">
        <ResizableLayout
          leftTop={
            <div className="panel panel--editor h-full">
              <EditorWindow
                steps={steps}
                currentStepIndex={currentStepIndex}
                onStepChange={setCurrentStepIndex}
                onActiveRuleChange={setActiveRule}
              />
            </div>
          }
          leftBottom={
            <ParserStatesPanel
              states={sampleStatesJson}
              stateStack={parseStatesStack}
            />
          }
          topLeft={
            <div className="panel h-full">
              <GrammarPanel
                activeRuleNo={activeRule?.ruleNo}
                showSemanticSteps={showSemanticRules}
                activeSemanticStep={activeSemanticStep}
              />
            </div>
          }
          topRight={
            <div className="panel h-full">
              <SymbolTablesPane tables={symbolTables.tables} focusId={symbolTables.focusId} />
            </div>
          }
          bottomLeft={
            <div className="panel h-full">
              <ASTPane ref={astRef} astData={sampleAstJson}/> 
            </div>
          }
          bottomRight={
            <div className="panel h-full">
             
            </div>
          }
        />
      </main>
    </div>
  );
}

export default App;
