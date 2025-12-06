import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import EditorWindow from "./components/EditorWindow";
import GrammarPanel from "./components/GrammarPanel";
import ResizableLayout from "./components/ResizableLayout";
import SymbolTablesPane from "./components/SymbolTablesPane";
import StepTimeline from "./components/StepTimeline";
import InsightsPanel from "./components/InsightsPanel";
import { sampleStepsData } from "./data/sampleSteps";
import type { ActiveRule, StepsData } from "./types/steps";
import { deriveSymbolTableState } from "./utils/symbolTables";

function App() {
  const [stepsData, setStepsData] = useState<StepsData>(sampleStepsData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeRule, setActiveRule] = useState<ActiveRule | null>(null);
  const [logLabel, setLogLabel] = useState("Sample data");
  const [loadError, setLoadError] = useState<string | null>(null);

  const steps = useMemo(() => stepsData.phases[0]?.steps ?? [], [stepsData]);

  useEffect(() => {
    if (steps.length === 0) {
      setCurrentStepIndex(0);
      return;
    }
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(steps.length - 1);
    }
  }, [steps, currentStepIndex]);

  const symbolTables = useMemo(
    () => deriveSymbolTableState(steps, currentStepIndex),
    [steps, currentStepIndex]
  );

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
          <label className="file-input">
            Load log
            <input type="file" accept="application/json" onChange={handleFileUpload} />
          </label>
          <button className="btn btn-ghost" onClick={handleUseSample}>
            Reset sample
          </button>
        </div>
      </header>
      <main className="workspace">
        <ResizableLayout
          left={
            <div className="panel panel--editor h-full">
              <EditorWindow
                steps={steps}
                currentStepIndex={currentStepIndex}
                onStepChange={setCurrentStepIndex}
                onActiveRuleChange={setActiveRule}
              />
            </div>
          }
          topLeft={
            <div className="panel h-full">
              <GrammarPanel
                activeRuleId={activeRule?.ruleId}
                activeSubRuleId={activeRule?.subRuleId}
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
              <StepTimeline steps={steps} currentStepIndex={currentStepIndex} />
            </div>
          }
          bottomRight={
            <div className="panel h-full">
              <InsightsPanel
                logLabel={logLabel}
                stepsCount={steps.length}
                totalScopes={symbolTables.tables.length}
                totalSymbols={totalSymbols}
              />
            </div>
          }
        />
      </main>
    </div>
  );
}

export default App;
