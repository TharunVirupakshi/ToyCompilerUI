import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import EditorWindow, {
  type EditorWindowHandle,
} from "./components/EditorWindow";
import GrammarPanel from "./components/GrammarPanel";
import ResizableLayout from "./components/ResizableLayout";
import SymbolTablesPane from "./components/SymbolTablesPane";
import { sampleStepsData, sampleAstJson, sampleStatesJson, sampleInputCode } from "./data";
import {
  PHASE_LABELS,
  PHASE_ORDER,
  type PhaseName,
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
import ICGLoggerPanel from "./components/ICGLoggerPanel";
import TACPanel from "./components/TACPanel";
import BackpatchListsPane from "./components/BackpatchListsPane";
import StepPickerModal from "./components/StepPickerModal";
import { compileSource } from "./api/compiler";
import { deriveParsePlaybackState } from "./utils/parsePlayback";
import { deriveParserStatesView } from "./utils/parserStatesView";
import { deriveASTPlaybackState } from "./utils/astPlayback";
import {
  deriveParseVisibleTimeline,
  findVisibleIndexForRawIndex,
} from "./utils/parseTimeline";
import { deriveSemanticPlaybackState } from "./utils/semanticPlayback";
import { deriveICGPlaybackState } from "./utils/icgPlayback";

interface SinglePhasePlaybackState {
  currentVisibleStepIndex: number;
  pendingParseRawAnchor: number | null;
}

type PhasePlaybackState = Record<PhaseName, SinglePhasePlaybackState>;

interface SemanticPhaseCache {
  astNodeIds: number[];
  symbolTables: ReturnType<typeof deriveSymbolTableState>;
}

const createInitialPhasePlaybackState = (): PhasePlaybackState => ({
  PHASE_LEX_PARSE: {
    currentVisibleStepIndex: -1,
    pendingParseRawAnchor: null,
  },
  PHASE_SEMANTIC: {
    currentVisibleStepIndex: -1,
    pendingParseRawAnchor: null,
  },
  PHASE_ICG: {
    currentVisibleStepIndex: -1,
    pendingParseRawAnchor: null,
  },
});

function App() {
  const [stepsData, setStepsData] = useState<StepsData>(sampleStepsData);
  const [astData, setAstData] = useState<ASTData>(sampleAstJson);
  const [sourceCode, setSourceCode] = useState<string>(sampleInputCode);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [phasePlaybackState, setPhasePlaybackState] = useState<PhasePlaybackState>(
    createInitialPhasePlaybackState
  );
  const [semanticPhaseCache, setSemanticPhaseCache] = useState<SemanticPhaseCache | null>(null);
  const [logLabel, setLogLabel] = useState("Sample data");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSemanticRules, setShowSemanticRules] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [astPaneReadyVersion, setAstPaneReadyVersion] = useState<number>(0);
  const [isStepPickerOpen, setIsStepPickerOpen] = useState<boolean>(false);
  const [isParseSuccessModalOpen, setIsParseSuccessModalOpen] = useState<boolean>(false);
  const [hasDismissedParseSuccessModal, setHasDismissedParseSuccessModal] = useState<boolean>(false);
  const [tacScrollRequest, setTacScrollRequest] = useState<{
    instructionNo: number | null;
    version: number;
  }>({ instructionNo: null, version: 0 });

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
  const activePhaseName = activePhaseSlot?.phaseName ?? "PHASE_LEX_PARSE";
  const steps = useMemo(() => activePhaseSlot?.logPhase?.steps ?? [], [activePhaseSlot]);
  const isSemanticPhase = activePhaseSlot?.phaseName === "PHASE_SEMANTIC";
  const isICGPhase = activePhaseSlot?.phaseName === "PHASE_ICG";
  const parsePhaseSlot = useMemo(
    () => phaseSlots.find((slot) => slot.phaseName === "PHASE_LEX_PARSE") ?? null,
    [phaseSlots]
  );
  const nextAvailablePhaseIndex = useMemo(
    () => phaseSlots.findIndex((slot, index) => index > activePhaseIndex && slot.isAvailable),
    [activePhaseIndex, phaseSlots]
  );
  const astRef = useRef<ASTPaneHandle>(null);
  const editorRef = useRef<EditorWindowHandle>(null);

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

  const hardResetPhaseState = useCallback(() => {
    setPhasePlaybackState(createInitialPhasePlaybackState());
    setSemanticPhaseCache(null);
    astRef.current?.resetGraph();
  }, []);

  const setPhaseVisibleStepIndex = useCallback((phaseName: PhaseName, nextIndex: number) => {
    setPhasePlaybackState((previous) => {
      if (previous[phaseName].currentVisibleStepIndex === nextIndex) {
        return previous;
      }

      return {
        ...previous,
        [phaseName]: {
          ...previous[phaseName],
          currentVisibleStepIndex: nextIndex,
        },
      };
    });
  }, []);

  const setPhasePendingParseRawAnchor = useCallback((phaseName: PhaseName, rawIndex: number | null) => {
    setPhasePlaybackState((previous) => {
      if (previous[phaseName].pendingParseRawAnchor === rawIndex) {
        return previous;
      }

      return {
        ...previous,
        [phaseName]: {
          ...previous[phaseName],
          pendingParseRawAnchor: rawIndex,
        },
      };
    });
  }, []);

  const switchPhase = useCallback(
    (targetPhaseIndex: number) => {
      const targetSlot = phaseSlots[targetPhaseIndex];
      if (!targetSlot || !targetSlot.isAvailable || targetPhaseIndex === activePhaseIndex) {
        return;
      }

      setActivePhaseIndex(targetPhaseIndex);
    },
    [activePhaseIndex, phaseSlots]
  );

  const handleSelectTACInstruction = useCallback((instructionNo: number) => {
    setTacScrollRequest((previous) => ({
      instructionNo,
      version: previous.version + 1,
    }));
  }, []);

  useEffect(() => {
    if (phaseSlots.length === 0) return;
    if (activePhaseSlot?.isAvailable) return;
    setActivePhaseIndex(firstAvailablePhaseIndex);
  }, [activePhaseSlot, firstAvailablePhaseIndex, phaseSlots.length]);

  useEffect(() => {
    setIsStepPickerOpen(false);
  }, [activePhaseIndex, stepsData]);

  const parseRawSteps = parsePhaseSlot?.logPhase?.steps ?? [];
  const parsePhaseState = phasePlaybackState.PHASE_LEX_PARSE;
  const semanticPhaseState = phasePlaybackState.PHASE_SEMANTIC;
  const icgPhaseState = phasePlaybackState.PHASE_ICG;

  const parseVisibleTimeline = useMemo(
    () =>
      deriveParseVisibleTimeline(
        parseRawSteps,
        showSemanticRules,
        parsePhaseState.currentVisibleStepIndex
      ),
    [parsePhaseState.currentVisibleStepIndex, parseRawSteps, showSemanticRules]
  );

  const parsePlayback = useMemo(
    () =>
      deriveParsePlaybackState(
        parseRawSteps,
        parseVisibleTimeline.currentRawStepIndex,
        showSemanticRules
      ),
    [parseRawSteps, parseVisibleTimeline.currentRawStepIndex, showSemanticRules]
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
        parseVisibleTimeline.currentRawStepIndex
      ),
    [parseRawSteps, parseVisibleTimeline.currentRawStepIndex]
  );

  const semanticBaselineASTPlayback = useMemo(
    () => deriveASTPlaybackState(parseRawSteps, parseRawSteps.length - 1),
    [parseRawSteps]
  );

  const semanticBaselineSymbolTables = useMemo(
    () => deriveSymbolTableState(parseRawSteps, parseRawSteps.length - 1),
    [parseRawSteps]
  );

  const visibleSteps =
    isSemanticPhase || isICGPhase
      ? steps
      : parseVisibleTimeline.visibleSteps;
  const effectiveStepIndex = isSemanticPhase
    ? semanticPhaseState.currentVisibleStepIndex
    : isICGPhase
      ? icgPhaseState.currentVisibleStepIndex
      : parseVisibleTimeline.currentVisibleStepIndex;
  const semanticPlayback = useMemo(
    () =>
      deriveSemanticPlaybackState(
        steps,
        semanticPhaseState.currentVisibleStepIndex
      ),
    [semanticPhaseState.currentVisibleStepIndex, steps]
  );
  const icgPlayback = useMemo(
    () => deriveICGPlaybackState(steps, icgPhaseState.currentVisibleStepIndex),
    [icgPhaseState.currentVisibleStepIndex, steps]
  );
  const activeICGNode = useMemo(
    () =>
      icgPlayback.activeNodeId === null
        ? null
        : astData.nodes.find(
            (node) => node.node_id === icgPlayback.activeNodeId
          ) ?? null,
    [astData.nodes, icgPlayback.activeNodeId]
  );
  const editorSourceHighlight = isICGPhase && activeICGNode
    ? {
        line: activeICGNode.start_line_no,
        char: activeICGNode.start_char_no,
        endLine: activeICGNode.end_line_no,
        endChar: activeICGNode.end_char_no,
        kind: "activity" as const,
      }
    : isSemanticPhase
      ? semanticPlayback.sourceHighlight
      : null;
  const isParsePhaseComplete =
    activePhaseName === "PHASE_LEX_PARSE" &&
    parsePlayback.parseError === null &&
    parseVisibleTimeline.visibleSteps.length > 0 &&
    parseVisibleTimeline.currentVisibleStepIndex === parseVisibleTimeline.visibleSteps.length - 1;

  useEffect(() => {
    if (!isParsePhaseComplete) {
      setIsParseSuccessModalOpen(false);
      setHasDismissedParseSuccessModal(false);
      return;
    }

    if (!hasDismissedParseSuccessModal) {
      setIsParseSuccessModalOpen(true);
    }
  }, [hasDismissedParseSuccessModal, isParsePhaseComplete]);

  useEffect(() => {
    if (parseVisibleTimeline.currentVisibleStepIndex === parsePhaseState.currentVisibleStepIndex) return;
    setPhaseVisibleStepIndex("PHASE_LEX_PARSE", parseVisibleTimeline.currentVisibleStepIndex);
  }, [
    parsePhaseState.currentVisibleStepIndex,
    parseVisibleTimeline.currentVisibleStepIndex,
    setPhaseVisibleStepIndex,
  ]);

  useEffect(() => {
    if (!isSemanticPhase || semanticPhaseCache !== null) return;

    setSemanticPhaseCache({
      astNodeIds: semanticBaselineASTPlayback.visibleNodeIds,
      symbolTables: semanticBaselineSymbolTables,
    });
  }, [
    isSemanticPhase,
    semanticBaselineASTPlayback.visibleNodeIds,
    semanticBaselineSymbolTables,
    semanticPhaseCache,
  ]);

  useEffect(() => {
    if (isSemanticPhase || isICGPhase) {
      astRef.current?.showNodes(
        semanticPhaseCache?.astNodeIds ?? semanticBaselineASTPlayback.visibleNodeIds
      );
      return;
    }

    astRef.current?.showNodes(parseASTPlayback.visibleNodeIds);
    if (parseASTPlayback.focusNodeId !== null) {
      astRef.current?.focusNode(parseASTPlayback.focusNodeId);
    }
  }, [
    astPaneReadyVersion,
    isSemanticPhase,
    isICGPhase,
    parseASTPlayback.focusNodeId,
    parseASTPlayback.visibleNodeIds,
    semanticBaselineASTPlayback.visibleNodeIds,
    semanticPhaseCache,
  ]);

  useEffect(() => {
    if (!isSemanticPhase && !isICGPhase) return;

    const activeNodeId = isICGPhase
      ? icgPlayback.activeNodeId
      : semanticPlayback.activeNodeId;
    if (activeNodeId === null) {
      astRef.current?.clearFocus();
      return;
    }

    astRef.current?.focusNode(activeNodeId);
  }, [
    astPaneReadyVersion,
    icgPlayback.activeNodeId,
    isICGPhase,
    isSemanticPhase,
    semanticPlayback.activeNodeId,
  ]);

  useEffect(() => {
    const rawAnchorIndex = parsePhaseState.pendingParseRawAnchor;
    if (rawAnchorIndex === null) return;

    setPhaseVisibleStepIndex(
      "PHASE_LEX_PARSE",
      findVisibleIndexForRawIndex(rawAnchorIndex, parseVisibleTimeline.visibleToRawIndex)
    );
    setPhasePendingParseRawAnchor("PHASE_LEX_PARSE", null);
  }, [
    parsePhaseState.pendingParseRawAnchor,
    parseVisibleTimeline.visibleToRawIndex,
    setPhasePendingParseRawAnchor,
    setPhaseVisibleStepIndex,
  ]);


  const symbolTables = useMemo(() => {
    if (isSemanticPhase) {
      const baseline =
        semanticPhaseCache?.symbolTables ?? semanticBaselineSymbolTables;
      return {
        ...baseline,
        focusId: semanticPlayback.symbolFocus?.scopeId ?? null,
      };
    }

    if (parseVisibleTimeline.currentRawStepIndex < 0) {
      return { tables: [], focusId: null };
    }
    return deriveSymbolTableState(parseRawSteps, parseVisibleTimeline.currentRawStepIndex);
  }, [
    isSemanticPhase,
    parseRawSteps,
    parseVisibleTimeline.currentRawStepIndex,
    semanticBaselineSymbolTables,
    semanticPhaseCache,
    semanticPlayback.symbolFocus?.scopeId,
  ]);

  const handleUseSample = useCallback(() => {
    setStepsData(sampleStepsData);
    setAstData(sampleAstJson);
    setSourceCode(sampleInputCode);
    setActivePhaseIndex(getFirstAvailablePhaseIndex(sampleStepsData));
    hardResetPhaseState();
    setIsStepPickerOpen(false);
    setIsParseSuccessModalOpen(false);
    setHasDismissedParseSuccessModal(false);
    setLogLabel("Sample data");
    setLoadError(null);
  }, [getFirstAvailablePhaseIndex, hardResetPhaseState]);

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setLoadError(null);
    const compileStartedAt = Date.now();

    try {
      const result = await compileSource(sourceCode);

      setStepsData(result.stepsData);
      setAstData(result.astData as ASTData);
      setActivePhaseIndex(getFirstAvailablePhaseIndex(result.stepsData));
      hardResetPhaseState();
      setIsStepPickerOpen(false);
      setIsParseSuccessModalOpen(false);
      setHasDismissedParseSuccessModal(false);
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
  }, [getFirstAvailablePhaseIndex, hardResetPhaseState, sourceCode]);

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
                  switchPhase(index);
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
          <button
            className="bg-neutral-600 rounded-sm p-1 px-3 font-mono font-light text-sm cursor-pointer"
            onClick={() => setPhaseVisibleStepIndex(activePhaseName, 0)}
          >
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
            if (parsePhaseState.currentVisibleStepIndex >= 0) {
              setPhasePendingParseRawAnchor(
                "PHASE_LEX_PARSE",
                parseVisibleTimeline.currentRawStepIndex
              );
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
                ref={editorRef}
                code={sourceCode}
                steps={visibleSteps}
                currentStepIndex={effectiveStepIndex}
                phaseName={activePhaseName}
                onCodeChange={setSourceCode}
                onStepChange={(nextIndex) => setPhaseVisibleStepIndex(activePhaseName, nextIndex)}
                onOpenStepPicker={() => setIsStepPickerOpen(true)}
                sourceHighlight={editorSourceHighlight}
              />
            </div>
          }
          leftBottom={
            isICGPhase ? (
              <ICGLoggerPanel activity={icgPlayback.activity} />
            ) : isSemanticPhase ? (
              <SemanticLoggerPanel playback={semanticPlayback} />
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
            isICGPhase ? (
              <div className="panel h-full">
                <TACPanel
                  instructions={icgPlayback.instructions}
                  activeInstructionNo={icgPlayback.activeInstructionNo}
                  scrollInstructionNo={tacScrollRequest.instructionNo}
                  scrollRequestVersion={tacScrollRequest.version}
                  backpatchInstructionNo={icgPlayback.activeBackpatchInstructionNo}
                  backpatchLabel={icgPlayback.activeBackpatchLabel}
                />
              </div>
            ) : isSemanticPhase ? null : (
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
              {isICGPhase ? (
                <BackpatchListsPane
                  lists={icgPlayback.pendingLists}
                  animation={icgPlayback.activeBackpatchAnimation}
                  onSelectInstruction={handleSelectTACInstruction}
                />
              ) : (
                <SymbolTablesPane
                tables={symbolTables.tables}
                focusId={symbolTables.focusId}
                symbolHighlight={
                  isSemanticPhase && semanticPlayback.symbolFocus
                    ? {
                        symbolName: semanticPlayback.symbolFocus.symbolName,
                        reason: semanticPlayback.symbolFocus.reason,
                        line: semanticPlayback.symbolFocus.line,
                        char: semanticPlayback.symbolFocus.char,
                      }
                    : null
                }
                />
              )}
            </div>
          }
          bottomLeft={
            <div className="panel h-full">
              <ASTPane
                ref={astRef}
                astData={astData}
                onReady={() => setAstPaneReadyVersion((value) => value + 1)}
                onNodeClick={(node) => {
                  editorRef.current?.highlightRange(
                    node.start_line_no,
                    node.start_char_no,
                    node.end_line_no,
                    node.end_char_no
                  );
                }}
              />
            </div>
          }
          bottomRight={
            <div className="panel h-full">
             
            </div>
          }
        />
      </main>
      {isParseSuccessModalOpen && (
        <div
          className="phase-modal-overlay"
          onClick={() => {
            setIsParseSuccessModalOpen(false);
            setHasDismissedParseSuccessModal(true);
          }}
        >
          <div className="phase-modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="phase-modal__title">PARSING SUCCESS</h2>
            <p className="phase-modal__body">
              Parsing completed successfully. You can continue reviewing parse steps or move to the next phase.
            </p>
            <div className="phase-modal__actions">
              <button
                className="phase-modal__button phase-modal__button--secondary"
                onClick={() => {
                  setIsParseSuccessModalOpen(false);
                  setHasDismissedParseSuccessModal(true);
                }}
              >
                Stay Here
              </button>
              {nextAvailablePhaseIndex >= 0 && (
                <button
                  className="phase-modal__button phase-modal__button--primary"
                  onClick={() => {
                    setIsParseSuccessModalOpen(false);
                    setHasDismissedParseSuccessModal(true);
                    switchPhase(nextAvailablePhaseIndex);
                  }}
                >
                  Go To {phaseSlots[nextAvailablePhaseIndex]?.label ?? "Next Phase"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <StepPickerModal
        isOpen={isStepPickerOpen}
        phaseLabel={activePhaseSlot?.label ?? "CURRENT"}
        steps={visibleSteps}
        currentStepIndex={effectiveStepIndex}
        onClose={() => setIsStepPickerOpen(false)}
        onSelectStep={(stepIndex) => setPhaseVisibleStepIndex(activePhaseName, stepIndex)}
      />
    </div>
  );
}

export default App;
