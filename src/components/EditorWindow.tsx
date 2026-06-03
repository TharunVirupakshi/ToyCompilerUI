import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
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

export interface EditorWindowHandle {
  highlightRange: (
    startLine: number,
    startChar: number,
    endLine: number,
    endChar: number
  ) => void;
}

const EditorWindow = forwardRef<
  EditorWindowHandle,
  EditorWindowProps
>((props, ref) => {
  const { onCodeChange, onStepChange, currentStepIndex, code, steps, phaseName, onOpenStepPicker } = props;
  const editorRef = useRef<any>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const lastLocationRef = useRef<{ line: number; char: number } | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const handleEditorMount = (
    editor: any,
    monaco: typeof Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useImperativeHandle(ref, () => ({
    highlightRange(startLine, startChar, endLine, endChar) {
      if (!editorRef.current || !monacoRef.current) {
        return;
      }

      decorationIdsRef.current =
        editorRef.current.deltaDecorations(
          decorationIdsRef.current,
          [
            {
              range: new monacoRef.current.Range(
                startLine,
                startChar,
                endLine,
                endChar
              ),
              options: {
                inlineClassName: "ast-node-highlight",
              },
            },
          ]
        );

      editorRef.current.revealLineInCenter(startLine);
    },
  }));

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

  useEffect(() => {
  if (!editorRef.current || !monacoRef.current) {
    return;
  }

  const model = editorRef.current.getModel();

  if (!model) {
    return;
  }

  const parseErrorStep = currentStep?.type === "PARSE_ERROR"
    ? currentStep
    : null;

  if (!parseErrorStep) {
    monacoRef.current.editor.setModelMarkers(
      model,
      "parse-errors",
      []
    );
    return;
  }

  const data = parseErrorStep.data as {
    line_no: string;
    char_no: string;
    message: string;
  };

  const line = Number(data.line_no);
  const col = Number(data.char_no);
  const lineContent = model.getLineContent(line);
  editorRef.current.revealLineInCenter(line);
  editorRef.current.setPosition({
    lineNumber: line,
    column: col,
  });

  monacoRef.current.editor.setModelMarkers(
    model,
    "parse-errors",
    [
      {
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: lineContent.length + 1,
        message: data.message,
        severity: monacoRef.current.MarkerSeverity.Error,
      },
    ]
  );
}, [currentStep]);

  const stepSummary = currentStep ? getStepSummary(currentStep) : "—";
  const isEnteringStateSummary = stepSummary.startsWith("ENTERING STATE");
  const isParseError = currentStep?.type === "PARSE_ERROR";
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
          {isParseError && (
            <span className="text-red-400 font-medium animate-[pulse_0.8s_ease-in-out_infinite]">
              PARSE ERROR
            </span>
          )}
          {!isParseError &&isParsePhaseComplete && (
            <span className="text-green-400 font-medium animate-[pulse_0.8s_ease-in-out_infinite]">
              PARSING SUCCESS
            </span>
          )}
          
          <span>•</span>
          <span
            title={stepSummary}
            className={`truncate max-w-[200px] text-gray-300 ${
              isEnteringStateSummary
                ? "animate-[pulse_0.8s_ease-in-out_infinite]"
                : ""
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
});

export default EditorWindow;