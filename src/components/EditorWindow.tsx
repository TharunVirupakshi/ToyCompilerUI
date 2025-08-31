import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

// ---- Step Data Types ----
export type StepType =
  | "PARSE_CREATE_SCOPE"
  | "PARSE_REDUCE_RULE"
  | "LEX_READ_TOKEN"
  | "PARSE_ADD_SYM"
  | "PARSE_ENTER_SCOPE"
  | "PARSE_EXIT_SCOPE";

// Data shape depends on step type
export interface ParseCreateScopeData {
  table_id: string;
  name: string;
  parent_id: string;
}

export interface ParseReduceRuleData {
  rule: string;
}

export interface LexReadTokenData {
  token: string;
  value: string;
  location: string; // e.g. "1:4"
}

export interface ParseAddSymData {
  name: string;
  sym_type: string;
  scope_id: string;
  is_function: string;
  line_no: string;
  char_no: string;
  is_duplicate: string;
}

export interface ParseEnterExitScopeData {
  table_id: string;
  name: string;
}

// Union of all step data
export type StepData =
  | ParseCreateScopeData
  | ParseReduceRuleData
  | LexReadTokenData
  | ParseAddSymData
  | ParseEnterExitScopeData;

// A single step
export interface Step {
  type: StepType;
  data: StepData;
}

// A phase groups multiple steps
export interface Phase {
  phase: string;
  steps: Step[];
}

// Root object
export interface StepsData {
  phases: Phase[];
}


const stepsData : StepsData = { "phases": [
  { "phase": "PHASE_LEX_PARSE", "steps": [
    { "type": "PARSE_CREATE_SCOPE", "data": {"table_id": "0", "name": "global", "parent_id": "0" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt_list → ε" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "KEYWORD", "value": "INT", "location": "1:4" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "type_spec → INT" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "WHITE_SPACE", "value": "", "location": "1:5" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "ID", "value": "i", "location": "1:6" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "WHITE_SPACE", "value": "", "location": "1:7" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "OPERATOR", "value": "ASSIGN", "location": "1:8" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "WHITE_SPACE", "value": "", "location": "1:9" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "INT_LITERAL", "value": "2", "location": "1:10" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "expr → INT_LITERAL" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "READ_CHARACTER", "value": ";", "location": "1:11" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "var → ID ASSIGN expr" }},
    { "type": "PARSE_ADD_SYM", "data": {"name": "i", "sym_type": "(null)", "scope_id": "0", "is_function": "0", "line_no": "1", "char_no": "11", "is_duplicate": "0" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "var_list → var" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "decl → type_spec var_list" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "decl_stmt → decl ';'" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt → decl_stmt" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt_list → stmt_list stmt" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "NEW_LINE", "value": "", "location": "2:1" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "NEW_LINE", "value": "", "location": "3:1" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "KEYWORD", "value": "VOID", "location": "3:5" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "WHITE_SPACE", "value": "", "location": "3:6" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "ID", "value": "main", "location": "3:10" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "READ_CHARACTER", "value": "(", "location": "3:11" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "func_header → VOID ID '('" }},
    { "type": "PARSE_ADD_SYM", "data": {"name": "main", "sym_type": "void", "scope_id": "0", "is_function": "1", "line_no": "3", "char_no": "11", "is_duplicate": "0" }},
    { "type": "PARSE_CREATE_SCOPE", "data": {"table_id": "1", "name": "main", "parent_id": "0" }},
    { "type": "PARSE_ENTER_SCOPE", "data": {"table_id": "1", "name": "main" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "READ_CHARACTER", "value": ")", "location": "3:12" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "params → ε" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "READ_CHARACTER", "value": "{", "location": "3:13" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt_list → ε" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "NEW_LINE", "value": "", "location": "4:1" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "WHITE_SPACE", "value": "", "location": "4:3" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "ID", "value": "i", "location": "4:4" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "WHITE_SPACE", "value": "", "location": "4:5" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "OPERATOR", "value": "ASSIGN", "location": "4:6" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "WHITE_SPACE", "value": "", "location": "4:7" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "INT_LITERAL", "value": "3", "location": "4:8" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "expr → INT_LITERAL" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "READ_CHARACTER", "value": ";", "location": "4:9" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "assgn_expr → ID ASSIGN expr" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "assgn_stmt → assgn_expr ;" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt → assgn_stmt" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt_list → stmt_list stmt" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "NEW_LINE", "value": "", "location": "5:1" }},
    { "type": "LEX_READ_TOKEN", "data": {"token": "READ_CHARACTER", "value": "}", "location": "5:2" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "block_stmt_without_scope → { stmt_list }" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "body → block_stmt_without_scope" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "func_decl → func_header params ')' body" }},
    { "type": "PARSE_EXIT_SCOPE", "data": {"table_id": "1", "name": "main" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt → func_decl" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "stmt_list → stmt_list stmt" }},
    { "type": "PARSE_REDUCE_RULE", "data": {"rule": "program → stmt_list" }}
  ]}
]}


export default function EditorWindow() {
  const [code, setCode] = useState<string>("");
  const editorRef = useRef<any>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  // Highlight on step change
  useEffect(() => {
    const step = stepsData.phases[0].steps[currentStep];
    if (!editorRef.current || !step || step.type !== "LEX_READ_TOKEN") return;

    const { location } = step.data as LexReadTokenData;
    const [line, char] = location.split(":").map(Number);

    editorRef.current.setSelection({
      startLineNumber: line,
      startColumn: char,
      endLineNumber: line,
      endColumn: char + 1,
    });
    editorRef.current.revealLineInCenter(line);
  }, [currentStep]);

  return (
  <div className="h-screen">
    {/* Controls */}
    <div className="p-2 flex gap-2 bg-gray-200">

        <button
          onClick={() =>
            setCurrentStep((s) =>
              s < stepsData.phases[0].steps.length - 1 ? s + 1 : s
            )
          }
          className="px-4 py-1 bg-green-500 text-white rounded"
        >
          Step →
        </button>
      </div>
      <Editor
        height="100%"
        width="100%"
        defaultLanguage="c"
        defaultValue="// Start typing here..."
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
        }}
      />
  </div>
  );
}
