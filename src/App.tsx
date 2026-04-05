import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import EditorWindow from "./components/EditorWindow";
import GrammarPanel from "./components/GrammarPanel";
import ResizableLayout from "./components/ResizableLayout";
import SymbolTablesPane from "./components/SymbolTablesPane";
import { sampleStepsData, sampleAstJson, sampleStatesJson, sampleInputCode } from "./data";
import {
  PHASE_LABELS,
  PHASE_ORDER,
  isKnownPhaseName,
} from "./types/steps";
import type {
  StepsData,
} from "./types/steps";
import { deriveSymbolTableState } from "./utils/symbolTables";
import ASTPane from "./components/ASTPane";
import type { ASTData, ASTPaneHandle } from "./components/ASTPane";
import ParserStatesPanel from "./components/ParserStatesPanel";
import SemanticLoggerPanel from "./components/SemanticLoggerPanel";
import { compileSource } from "./api/compiler";
import { deriveParsePlaybackState } from "./utils/parsePlayback";
import { deriveParserStatesView } from "./utils/parserStatesView";
import { deriveASTPlaybackState } from "./utils/astPlayback";
import {
  deriveParseVisibleTimeline,
  findVisibleIndexForRawIndex,
} from "./utils/parseTimeline";

type PhaseSwitchTrigger = "manual" | "end_of_phase";

interface PendingPhaseSwitch {
  sourcePhaseLabel: string;
  targetPhaseIndex: number;
  targetPhaseLabel: string;
  trigger: PhaseSwitchTrigger;
}

function App() {
  const [stepsData, setStepsData] = useState<StepsData>(sampleStepsData);
  const [astData, setAstData] = useState<ASTData>(sampleAstJson);
  const [sourceCode, setSourceCode] = useState<string>(sampleInputCode);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [logLabel, setLogLabel] = useState("Sample data");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSemanticRules, setShowSemanticRules] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [pendingPhaseSwitch, setPendingPhaseSwitch] = useState<PendingPhaseSwitch | null>(null);

  const phaseSlots = useMemo(
    () =>
      PHASE_ORDER.map((phaseName) => {
        const logPhase =
          stepsData.phases.find((phase) => isKnownPhaseName(phase.phase) && phase.phase === phaseName) ??
          null;

        return {
          phaseName,
          label: PHASE_LABELS[phaseName],
          logPhase,
          isAvailable: logPhase !== null,
        };
      }),
    [stepsData]
  );
  const activePhaseSlot = phaseSlots[activePhaseIndex] ?? phaseSlots[0] ?? null;
  const steps = useMemo(() => activePhaseSlot?.logPhase?.steps ?? [], [activePhaseSlot]);
  const isSemanticPhase = activePhaseSlot?.phaseName === "PHASE_SEMANTIC";
  const parsePhaseSlot = useMemo(
    () => phaseSlots.find((slot) => slot.phaseName === "PHASE_LEX_PARSE") ?? null,
    [phaseSlots]
  );
  const nextAvailablePhaseIndex = useMemo(
    () => phaseSlots.findIndex((slot, index) => index > activePhaseIndex && slot.isAvailable),
    [activePhaseIndex, phaseSlots]
  );
  const astRef = useRef<ASTPaneHandle>(null);
  const pendingParseRawAnchorRef = useRef<number | null>(null);

  const firstAvailablePhaseIndex = useMemo(() => {
    const index = phaseSlots.findIndex((slot) => slot.isAvailable);
    return index >= 0 ? index : 0;
  }, [phaseSlots]);

  const getFirstAvailablePhaseIndex = useCallback((data: StepsData) => {
    const index = PHASE_ORDER.findIndex((phaseName) =>
      data.phases.some((phase) => isKnownPhaseName(phase.phase) && phase.phase === phaseName)
    );
    return index >= 0 ? index : 0;
  }, []);

  const resetPhaseState = useCallback(() => {
    setCurrentStepIndex(-1);
    astRef.current?.resetGraph();
  }, []);

  const requestPhaseSwitch = useCallback(
    (targetPhaseIndex: number, trigger: PhaseSwitchTrigger) => {
      const targetSlot = phaseSlots[targetPhaseIndex];
      if (!targetSlot || !targetSlot.isAvailable || targetPhaseIndex === activePhaseIndex) {
        return;
      }

      setPendingPhaseSwitch({
        sourcePhaseLabel: activePhaseSlot?.label ?? "CURRENT PHASE",
        targetPhaseIndex,
        targetPhaseLabel: targetSlot.label,
        trigger,
      });
    },
    [activePhaseIndex, activePhaseSlot, phaseSlots]
  );

  const confirmPhaseSwitch = useCallback(() => {
    if (!pendingPhaseSwitch) return;
    resetPhaseState();
    setActivePhaseIndex(pendingPhaseSwitch.targetPhaseIndex);
    setPendingPhaseSwitch(null);
  }, [pendingPhaseSwitch, resetPhaseState]);

  const cancelPhaseSwitch = useCallback(() => {
    setPendingPhaseSwitch(null);
  }, []);

  useEffect(() => {
    if (phaseSlots.length === 0) return;
    if (activePhaseSlot?.isAvailable) return;
    setActivePhaseIndex(firstAvailablePhaseIndex);
  }, [activePhaseSlot, firstAvailablePhaseIndex, phaseSlots.length]);

  const parseRawSteps = parsePhaseSlot?.logPhase?.steps ?? [];

  const parseVisibleTimeline = useMemo(
    () =>
      deriveParseVisibleTimeline(
        parseRawSteps,
        showSemanticRules,
        isSemanticPhase ? -1 : currentStepIndex
      ),
    [currentStepIndex, isSemanticPhase, parseRawSteps, showSemanticRules]
  );

  const parsePlayback = useMemo(
    () =>
      deriveParsePlaybackState(
        parseRawSteps,
        isSemanticPhase ? -1 : parseVisibleTimeline.currentRawStepIndex,
        showSemanticRules
      ),
    [isSemanticPhase, parseRawSteps, parseVisibleTimeline.currentRawStepIndex, showSemanticRules]
  );

  const parserStatesView = useMemo(
    () =>
      deriveParserStatesView(
        sampleStatesJson,
        parsePlayback.stateStack,
        parsePlayback.symbolStack,
        parsePlayback.lookahead,
        parsePlayback.highlightReduce,
        parsePlayback.highlightReduceComplete
      ),
    [parsePlayback]
  );

  const parseASTPlayback = useMemo(
    () =>
      deriveASTPlaybackState(
        parseRawSteps,
        isSemanticPhase ? -1 : parseVisibleTimeline.currentRawStepIndex
      ),
    [isSemanticPhase, parseRawSteps, parseVisibleTimeline.currentRawStepIndex]
  );

  const semanticASTPlayback = useMemo(
    () => deriveASTPlaybackState(parseRawSteps, parseRawSteps.length - 1),
    [parseRawSteps]
  );

  const visibleSteps = isSemanticPhase ? steps : parseVisibleTimeline.visibleSteps;
  const effectiveStepIndex = isSemanticPhase
    ? currentStepIndex
    : parseVisibleTimeline.currentVisibleStepIndex;

  useEffect(() => {
    if (isSemanticPhase) return;
    if (parseVisibleTimeline.currentVisibleStepIndex === currentStepIndex) return;
    setCurrentStepIndex(parseVisibleTimeline.currentVisibleStepIndex);
  }, [currentStepIndex, isSemanticPhase, parseVisibleTimeline.currentVisibleStepIndex]);

  useEffect(() => {
    if (isSemanticPhase) {
      astRef.current?.showNodes(semanticASTPlayback.visibleNodeIds);
      return;
    }

    astRef.current?.showNodes(parseASTPlayback.visibleNodeIds);
    if (parseASTPlayback.focusNodeId !== null) {
      astRef.current?.focusNode(parseASTPlayback.focusNodeId);
    }
  }, [
    isSemanticPhase,
    parseASTPlayback.focusNodeId,
    parseASTPlayback.visibleNodeIds,
    semanticASTPlayback.visibleNodeIds,
  ]);

  useEffect(() => {
    if (isSemanticPhase) {
      pendingParseRawAnchorRef.current = null;
      return;
    }

    const rawAnchorIndex = pendingParseRawAnchorRef.current;
    if (rawAnchorIndex === null) return;

    pendingParseRawAnchorRef.current = null;
    setCurrentStepIndex(
      findVisibleIndexForRawIndex(rawAnchorIndex, parseVisibleTimeline.visibleToRawIndex)
    );
  }, [isSemanticPhase, parseVisibleTimeline.visibleToRawIndex]);


  const symbolTables = useMemo(() => {
    if (isSemanticPhase) {
      if (currentStepIndex < 0) {
        return { tables: [], focusId: null };
      }
      return deriveSymbolTableState(steps, currentStepIndex);
    }

    if (parseVisibleTimeline.currentRawStepIndex < 0) {
      return { tables: [], focusId: null };
    }
    return deriveSymbolTableState(parseRawSteps, parseVisibleTimeline.currentRawStepIndex);
  }, [currentStepIndex, isSemanticPhase, parseRawSteps, parseVisibleTimeline.currentRawStepIndex, steps]);

  const handleUseSample = useCallback(() => {
    setStepsData(sampleStepsData);
    setAstData(sampleAstJson);
    setSourceCode(sampleInputCode);
    setActivePhaseIndex(getFirstAvailablePhaseIndex(sampleStepsData));
    resetPhaseState();
    setPendingPhaseSwitch(null);
    setLogLabel("Sample data");
    setLoadError(null);
  }, [getFirstAvailablePhaseIndex, resetPhaseState]);

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setLoadError(null);
    const compileStartedAt = Date.now();

    try {
      const result = await compileSource(sourceCode);

      setStepsData(result.stepsData);
      setAstData(result.astData as ASTData);
      setActivePhaseIndex(getFirstAvailablePhaseIndex(result.stepsData));
      resetPhaseState();
      setPendingPhaseSwitch(null);
      setLogLabel("Compiled source");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Compilation failed.");
    } finally {
      const elapsedMs = Date.now() - compileStartedAt;
      const remainingDelayMs = Math.max(0, 1000 - elapsedMs);

      if (remainingDelayMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingDelayMs));
      }

      setIsCompiling(false);
    }
  }, [getFirstAvailablePhaseIndex, resetPhaseState, sourceCode]);

  return (
    <div className="app-root flex flex-col h-screen">
      <header className="app-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-brand">compiler ui</span>
          <span className="toolbar-file">{logLabel}</span>
          {loadError && <span className="text-muted">({loadError})</span>}
        </div>
        {phaseSlots.length > 0 && (
          <div className="phase-slider">
            <div
              className="phase-slider__thumb"
              style={{
                width: `${100 / phaseSlots.length}%`,
                transform: `translateX(${activePhaseIndex * 100}%)`,
              }}
            />
            {phaseSlots.map((slot, index) => (
              <button
                key={`${slot.phaseName}-${index}`}
                type="button"
                className={`phase-slider__item ${
                  index === activePhaseIndex ? "phase-slider__item--active" : ""
                } ${
                  !slot.isAvailable ? "phase-slider__item--disabled" : ""
                }`}
                onClick={() => {
                  if (!slot.isAvailable) return;
                  requestPhaseSwitch(index, "manual");
                }}
                disabled={!slot.isAvailable}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
        <div className="toolbar-actions">
        <button
          className={`rounded-sm p-1 px-3 font-mono font-light text-sm cursor-pointer transition-colors disabled:cursor-default ${
            isCompiling
              ? "bg-blue-600 text-white animate-[pulse_0.8s_ease-in-out_infinite]"
              : "bg-neutral-600 text-gray-100"
          }`}
          onClick={handleCompile}
          disabled={isCompiling}
        >
          {isCompiling ? "Compiling..." : "Compile"}
        </button>
        {effectiveStepIndex < 0 && (
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
          onClick={() => {
            if (!isSemanticPhase && currentStepIndex >= 0) {
              pendingParseRawAnchorRef.current = parseVisibleTimeline.currentRawStepIndex;
            }
            setShowSemanticRules((value) => !value);
          }}
        >
          {showSemanticRules ? "Semantic: ON" : "Semantic: OFF"}
        </button>
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
                code={sourceCode}
                steps={visibleSteps}
                currentStepIndex={effectiveStepIndex}
                onCodeChange={setSourceCode}
                onStepChange={setCurrentStepIndex}
                onPhaseEndNext={() => {
                  if (nextAvailablePhaseIndex >= 0) {
                    requestPhaseSwitch(nextAvailablePhaseIndex, "end_of_phase");
                  }
                }}
              />
            </div>
          }
          leftBottom={
            isSemanticPhase ? (
              <SemanticLoggerPanel />
            ) : (
              <ParserStatesPanel
                states={sampleStatesJson}
                stateStack={parsePlayback.stateStack}
                symbolStack={parsePlayback.symbolStack}
                lookahead={parsePlayback.lookahead}
                reduceCount={parsePlayback.reduceCount}
                highlightReduce={parsePlayback.highlightReduce}
                highlightReduceComplete={parsePlayback.highlightReduceComplete}
                activeState={parserStatesView.activeState}
                highlightedAction={parserStatesView.highlightedAction}
              />
            )
          }
          topLeft={
            isSemanticPhase ? null : (
              <div className="panel h-full">
                <GrammarPanel
                  activeRuleNo={parsePlayback.activeRule?.ruleNo}
                  showSemanticSteps={showSemanticRules}
                  activeSemanticStep={parsePlayback.activeSemanticStep}
                />
              </div>
            )
          }
          topRight={
            <div className="panel h-full">
              <SymbolTablesPane tables={symbolTables.tables} focusId={symbolTables.focusId} />
            </div>
          }
          bottomLeft={
            <div className="panel h-full">
              <ASTPane ref={astRef} astData={astData}/> 
            </div>
          }
          bottomRight={
            <div className="panel h-full">
             
            </div>
          }
        />
      </main>
      {pendingPhaseSwitch && (
        <div className="phase-modal-overlay">
          <div className="phase-modal">
            <h2 className="phase-modal__title">Switch Phase</h2>
            <p className="phase-modal__body">
              Switching from {pendingPhaseSwitch.sourcePhaseLabel} to {pendingPhaseSwitch.targetPhaseLabel} resets the current phase state.
            </p>
            <p className="phase-modal__body">
              Switching to semantic rebuilds the AST from completed parse steps. Switching back to parse starts that phase from the beginning.
            </p>
            <p className="phase-modal__meta">
              Trigger: {pendingPhaseSwitch.trigger === "manual" ? "manual phase selection" : "end of current phase"}
            </p>
            <div className="phase-modal__actions">
              <button className="phase-modal__button phase-modal__button--secondary" onClick={cancelPhaseSwitch}>
                Cancel
              </button>
              <button className="phase-modal__button phase-modal__button--primary" onClick={confirmPhaseSwitch}>
                Switch Phase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
