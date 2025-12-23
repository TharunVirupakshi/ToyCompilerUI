import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type {
  ActiveRule,
  LexReadTokenData,
  ParseReduceRuleData,
  Step,
} from "../types/steps";

interface EditorWindowProps {
  steps: Step[];
  currentStepIndex: number;
  onStepChange: (nextIndex: number) => void;
  onActiveRuleChange?: (rule: ActiveRule | null) => void;
}

export default function EditorWindow({
  steps,
  currentStepIndex,
  onStepChange,
  onActiveRuleChange,
}: EditorWindowProps) {
  const [code, setCode] = useState<string>("");
  const editorRef = useRef<any>(null);
  const lastLocationRef = useRef<{ line: number; char: number } | null>(null);
  const [lexStep, setLexStep] = useState<LexReadTokenData | null>(null);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  const currentStep =
  currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  // Highlight on step change
  useEffect(() => {
    if (!editorRef.current || !currentStep || currentStep.type !== "LEX_READ_TOKEN") {
      setLexStep(null);
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
    setLexStep(currentStep.data as LexReadTokenData);
  }, [currentStep]);

  useEffect(() => {
    if (!onActiveRuleChange) return;
    if (currentStep && currentStep.type === "PARSE_REDUCE_RULE") {
      const { ruleId, subRuleId } = currentStep.data as ParseReduceRuleData;
      onActiveRuleChange({
        ruleId: Number(ruleId),
        subRuleId: Number(subRuleId),
      });
    }
  }, [currentStep, onActiveRuleChange]);

  const handleStep = (delta: number) => {
    const next = currentStepIndex + delta;
    if (next < 0 || next >= steps.length) return;
    onStepChange(next);
  };

  const locationLabel = useMemo(() => {
    if (!lexStep?.location) return null;
    return lexStep.location;
  }, [lexStep]);

  return (
    <div className="h-full">
      <div className="flex justify-between p-1 bg-neutral-800">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>
            STEP {currentStepIndex + 1}/{steps.length || 1}
          </span>
          <span>•</span>
          <span>{currentStep ? currentStep.type : "—"}</span>
          <span>•</span>
          <span>
            {lexStep?.token ?? "—"}
            {lexStep?.value ? ` (${lexStep.value})` : ""}
          </span>
          <span>•</span>
          <span>{locationLabel ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
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
          defaultValue={`int i = 2;

void main(){
  i = 3;
}`}
          theme="vs-dark"
          value={code}
          onMount={handleEditorMount}
          onChange={(value) => setCode(value || "")}
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
