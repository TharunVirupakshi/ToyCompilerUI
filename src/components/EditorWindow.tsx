import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type {
  ActiveRule,
  LexReadTokenData,
  ParseAddSymData,
  ParseAssgnSymType,
  ParseCreateASTNodeData,
  ParseCreateScopeData,
  ParseEnterExitScopeData,
  ParseEnteringState,
  ParseReduceRuleData,
  ParseSemanticStepData,
  Step,
} from "../types/steps";
import { sampleInputCode } from "../data";

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
      const { ruleNo } = currentStep.data as ParseReduceRuleData;
      onActiveRuleChange({
        ruleNo: Number(ruleNo)
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

  function getStepSummary(step: Step): string {
    switch (step.type) {
      case "LEX_READ_TOKEN": {
        const { token, value, location } = step.data as LexReadTokenData;
        return `LEX: ${token}${value ? `(${value})` : ""} @ ${location}`;
      }
  
      case "PARSE_REDUCE_RULE": {
        const { ruleNo, rule } = step.data as ParseReduceRuleData;
        return `REDUCE: ${rule} [${ruleNo}]`;
      }
  
      case "PARSE_SEMANTIC_STEP": {
        const { instr, stepNo } = step.data as ParseSemanticStepData;
        return `SEMANTIC(${stepNo}): ${instr}`;
      }
  
      case "PARSE_CREATE_AST_NODE": {
        return `AST NODE CREATED: #${(step.data as ParseCreateASTNodeData).node_id}`;
      }
  
      case "PARSE_CREATE_SCOPE": {
        const { name, table_id, parent_id } = step.data as ParseCreateScopeData;
        return `SCOPE CREATE: ${name} (id=${table_id}, parent=${parent_id})`;
      }
  
      case "PARSE_ENTER_SCOPE": {
        const { name, table_id } = step.data as ParseEnterExitScopeData
        return `ENTER SCOPE: ${name} (id=${table_id})`;
      }

      case "PARSE_EXIT_SCOPE": {
        const { name, table_id } = step.data as ParseEnterExitScopeData
        return `EXIT SCOPE: ${name} (id=${table_id})`;
      }
  
      case "PARSE_ADD_SYM": {
        const d = step.data as ParseAddSymData;
        return `ADD SYMBOL: ${d.name} : ${d.sym_type} (scope ${d.scope_id})`;
      }
  
      case "PARSE_ASSGN_SYM_TYPE": {
        const d = step.data as ParseAssgnSymType;
        return `TYPE ASSIGN: ${d.name} ← ${d.sym_type}`;
      }

      case "PARSE_ENTERING_STATE": {
        const d = step.data as ParseEnteringState;
        return `ENTERING STATE: ${d.state}` 
      }
  
      default:
        return step.type;
    }
  }
  

  return (
    <div className="h-full">
      <div className="flex justify-between p-1 bg-neutral-800">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>
            STEP {currentStepIndex + 1}/{steps.length || 1}
          </span>
          <span>•</span>
          <span className="truncate max-w-[600px] text-gray-300">
          {currentStep ? getStepSummary(currentStep) : "—"}
          </span>
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
          defaultValue={sampleInputCode}
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
