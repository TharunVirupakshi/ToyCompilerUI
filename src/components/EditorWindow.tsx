import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type {
  LexReadTokenData,
  Step,
} from "../types/steps";
import { getStepSummary } from "../utils/stepSummary";
interface EditorWindowProps {
  code: string;
  steps: Step[];
  currentStepIndex: number;
  phaseName: string;
  onCodeChange: (code: string) => void;
  onStepChange: (nextIndex: number) => void;
  onOpenStepPicker?: () => void;
}

export default function EditorWindow({
  code,
  steps,
  currentStepIndex,
  phaseName,
  onCodeChange,
  onStepChange,
  onOpenStepPicker,
}: EditorWindowProps) {
  const editorRef = useRef<any>(null);
  const lastLocationRef = useRef<{ line: number; char: number } | null>(null);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const currentStep =
  currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  // Highlight on step change
  useEffect(() => {
    if (!editorRef.current || !currentStep || currentStep.type !== "LEX_READ_TOKEN") {
      return;
    }

    const { location } = currentStep.data as LexReadTokenData;
    const [line, char] = location.split(":").map(Number);

    const startLine = lastLocationRef.current?.line ?? line;
    const startCol = lastLocationRef.current?.char ?? char;

    editorRef.current.setSelection({
      startLineNumber: startLine,
      startColumn: startCol,
      endLineNumber: line,
      endColumn: char, // always advance 1 col per step
    });

    editorRef.current.revealLineInCenter(line);

    lastLocationRef.current = { line, char };
  }, [currentStep]);

  const handleStep = (delta: number) => {
    const next = currentStepIndex + delta;

    if (next < 0 || next >= steps.length) return;
    onStepChange(next);
  };

  const stepSummary = currentStep ? getStepSummary(currentStep) : "—";
  const isEnteringStateSummary = stepSummary.startsWith("ENTERING STATE");
  const isParsePhaseComplete =
    phaseName === "PHASE_LEX_PARSE" &&
    currentStepIndex >= 0 &&
    currentStepIndex === steps.length - 1;
  

  return (
    <div className="h-full">
      <div className="flex justify-between p-1 bg-neutral-800">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>
            STEP {currentStepIndex + 1}/{steps.length || 1}
          </span>
          {isParsePhaseComplete && (
            <span className="text-green-400 font-medium animate-[pulse_0.8s_ease-in-out_infinite]">
              PARSING SUCCESS
            </span>
          )}
          <span>•</span>
          <span
            className={`truncate max-w-[600px] text-gray-300 ${
              isEnteringStateSummary ? "animate-[pulse_0.8s_ease-in-out_infinite]" : ""
            }`}
          >
          {stepSummary}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
        <button
          className="bg-neutral-600 rounded-sm p-1 px-3 font-mono font-light text-sm cursor-pointer"
          onClick={onOpenStepPicker}
          title="View all steps"
          aria-label="View all steps"
        >
          Steps
        </button>
        <button
          className="bg-neutral-600 rounded-sm p-1 px-3 font-mono font-light text-sm cursor-pointer"
          onClick={() => handleStep(-1)}
          disabled={currentStepIndex <= 0}
        >
          Prev
        </button>

        <button
          className="bg-neutral-600 rounded-sm p-1 px-3 font-mono font-light text-sm cursor-pointer"
          onClick={() => handleStep(1)}
          disabled={currentStepIndex < 0 || currentStepIndex >= steps.length - 1}
        >
          Next
        </button>
        </div>
      </div>
      <div className="h-full">
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="c"
          theme="vs-dark"
          value={code}
          onMount={handleEditorMount}
          onChange={(value) => onCodeChange(value || "")}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 14,
            occurrencesHighlight: "off",
            selectionHighlight: false,
          }}
        />
      </div>
    </div>
  );
}
