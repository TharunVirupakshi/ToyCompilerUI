import React, { useEffect, useRef } from "react";
import type { ParseSemanticStepData } from "../types/steps";

interface GrammarPanelProps {
  activeRuleId?: number; // e.g., 13
  activeSubRuleId?: number; // e.g., 2 for 13.2
  /** semantic view controls */
  showSemanticSteps?: boolean;
  activeSemanticStep?: ParseSemanticStepData | null;
}

export interface SemanticStep {
  stepNo: number;
  instr: string;
}
export interface GrammarRule {
  id: number;
  subId: number;
  text: string;
  semanticSteps: SemanticStep[];
}


const grammarRules: GrammarRule[] = [
    // program
    {
      id: 1,
      subId: 1,
      text: "program → stmt_list",
      semanticSteps: [
        { stepNo: 1, instr: "root = createProgramNode($1)" },
      ],
    },
  
    // stmt_list
    {
      id: 2,
      subId: 1,
      text: "stmt_list → stmt_list stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = createStmtListNode($1, $2)" },
      ],
    },
    {
      id: 2,
      subId: 2,
      text: "stmt_list → ε",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = NULL" },
      ],
    },
  
    // stmt
    {
      id: 3,
      subId: 1,
      text: "stmt → decl_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 2,
      text: "stmt → assgn_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 3,
      text: "stmt → expr_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 4,
      text: "stmt → cond_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 5,
      text: "stmt → block_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 6,
      text: "stmt → loop_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 7,
      text: "stmt → ret_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 8,
      text: "stmt → func_decl",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 9,
      text: "stmt → func_call_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 10,
      text: "stmt → break_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 11,
      text: "stmt → continue_stmt",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = $1" },
      ],
    },
    {
      id: 3,
      subId: 12,
      text: "stmt → ';'",
      semanticSteps: [
        { stepNo: 1, instr: "$$ = NULL" },
      ],
    },
  // Return statements
  {
    id: 4,
    subId: 1,
    text: "ret_stmt → RETURN expr ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createReturnNode($2)" },
    ],
  },
  {
    id: 4,
    subId: 2,
    text: "ret_stmt → RETURN ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createReturnNode(NULL)" },
    ],
  },

  // Function call statement
  {
    id: 5,
    subId: 1,
    text: "func_call_stmt → func_call ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },

  // Assignment statement
  {
    id: 6,
    subId: 1,
    text: "assgn_stmt → assgn_expr ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },

  // Assignment expression
  {
    id: 6,
    subId: 2,
    text: "assgn_expr → ID ASSIGN expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createAssgnNode($1, $3)" },
    ],
  },

  // Block statement (with scope)
  {
    id: 7,
    subId: 1,
    text: "block_stmt → { stmt_list }",
    semanticSteps: [
      { stepNo: 1, instr: "enterBlockScope()" },
      { stepNo: 2, instr: "$$ = createBlockStmtNode($3)" },
      { stepNo: 3, instr: "exitScope()" },
    ],
  },

  // Block statement without scope
  {
    id: 8,
    subId: 1,
    text: "block_stmt_without_scope → { stmt_list }",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBlockStmtNode($2)" },
    ],
  },
  // body
  {
    id: 9,
    subId: 1,
    text: "body → block_stmt_without_scope",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 2,
    text: "body → decl_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 3,
    text: "body → assgn_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 4,
    text: "body → expr_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 5,
    text: "body → cond_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 6,
    text: "body → loop_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 7,
    text: "body → ret_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 8,
    text: "body → func_decl",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 9,
    text: "body → func_call_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 10,
    text: "body → break_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 11,
    text: "body → continue_stmt",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 9,
    subId: 12,
    text: "body → ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = NULL" },
    ],
  },

  // break / continue
  {
    id: 10,
    subId: 1,
    text: "break_stmt → BREAK ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBreakNode()" },
    ],
  },
  {
    id: 11,
    subId: 1,
    text: "continue_stmt → CONTINUE ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createContinueNode()" },
    ],
  },
  {
    id: 12,
    subId: 1,
    text: "cond_stmt → IF '(' expr ')' body else_part",
    semanticSteps: [
      { stepNo: 1, instr: "enterIfBlockScope()" },
      { stepNo: 2, instr: "exitScope()" },
      { stepNo: 3, instr: "$$ = createIfElseNode($3, $6, $8.else_body)" },
    ],
  },

  // else_part
  {
    id: 13,
    subId: 1,
    text: "else_part → body",
    semanticSteps: [
      { stepNo: 1, instr: "enterElseBlockScoep()" },
      { stepNo: 2, instr: "$$.else_body = $3" },
      { stepNo: 3, instr: "exitScope()" },
    ],
  },
  {
    id: 13,
    subId: 2,
    text: "else_part → ε",
    semanticSteps: [
      { stepNo: 1, instr: "$$.else_body = NULL" },
    ],
  },

  // Loop statements
  {
    id: 14,
    subId: 1,
    text: "loop_stmt → WHILE '(' expr ')' body",
    semanticSteps: [
      { stepNo: 1, instr: "enterWhileBlockScope()" },
      { stepNo: 2, instr: "$$ = createWhileNode($3, $6)" },
      { stepNo: 3, instr: "exitScope()" },
    ],
  },
  {
    id: 14,
    subId: 2,
    text: "loop_stmt → FOR '('",
    semanticSteps: [
      { stepNo: 1, instr: "enterForBlockScope()" },
      { stepNo: 2, instr: "$$ = createForNode($4, $6, $8, $10)" },
      { stepNo: 3, instr: "exitScope()" },
    ],
  },

  // for_init
  {
    id: 15,
    subId: 1,
    text: "for_init → decl",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 15,
    subId: 2,
    text: "for_init → expr_list",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 15,
    subId: 3,
    text: "for_init → ε",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = NULL" },
    ],
  },
   // expr_list
   {
    id: 16,
    subId: 1,
    text: "expr_list → expr_list ',' expr_list_item",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createCommaExprList($1, $3)" },
    ],
  },
  {
    id: 16,
    subId: 2,
    text: "expr_list → expr_list_item",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createCommaExprList(NULL, $1)" },
    ],
  },

  // expr_list_item
  {
    id: 17,
    subId: 1,
    text: "expr_list_item → assgn_expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 17,
    subId: 2,
    text: "expr_list_item → expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },

  // for_expr
  {
    id: 18,
    subId: 1,
    text: "for_expr → expr_list",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 18,
    subId: 2,
    text: "for_expr → ε",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = NULL" },
    ],
  },

  // decl_stmt
  {
    id: 19,
    subId: 1,
    text: "decl_stmt → decl ';'",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },

  // decl
  {
    id: 20,
    subId: 1,
    text: "decl → type_spec var_list",
    semanticSteps: [
      { stepNo: 1, instr: "setVarListType($1, $2)" },
      { stepNo: 2, instr: "$$ = createDeclNode($1, $2)" },
    ],
  },

  // type_spec
  {
    id: 21,
    subId: 1,
    text: "type_spec → INT",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTypeNode(INT)" },
    ],
  },
  {
    id: 21,
    subId: 2,
    text: "type_spec → CHAR",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTypeNode(CHAR)" },
    ],
  },
  {
    id: 21,
    subId: 3,
    text: "type_spec → FLOAT",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTypeNode(FLOAT)" },
    ],
  },
  {
    id: 21,
    subId: 4,
    text: "type_spec → STRING",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTypeNode(STRING)" },
    ],
  },
  // var_list
  {
    id: 22,
    subId: 1,
    text: "var_list → var_list ',' var",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createVarListNode($1, $3)" },
    ],
  },
  {
    id: 22,
    subId: 2,
    text: "var_list → var",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createVarListNode(NULL, $1)" },
    ],
  },

  // var
  {
    id: 23,
    subId: 1,
    text: "var → ID",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createVarNode($1)" },
    ],
  },
  {
    id: 23,
    subId: 2,
    text: "var → ID ASSIGN expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createVarAssgnNode($1, $3)" },
    ],
  },

  // func_decl
  {
    id: 24,
    subId: 1,
    text: "func_decl → func_header params ')' body",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createFuncDeclNode($1.type, $1.id, $2, $4)" },
      { stepNo: 2, instr: "exitScope()" },
    ],
  },

  // func_header
  {
    id: 25,
    subId: 1,
    text: "func_header → type_spec ID '('",
    semanticSteps: [
      { stepNo: 1, instr: "$$.type = $1" },
      { stepNo: 2, instr: "$$.id = createFucnIdNode($2, $1)" },
      { stepNo: 3, instr: "enterFunctionScope()" },
    ],
  },
  {
    id: 25,
    subId: 2,
    text: "func_header → VOID ID '('",
    semanticSteps: [
      { stepNo: 1, instr: "$$.type = createTypeNode(VOID)" },
      { stepNo: 2, instr: "$$.id = createFucnIdNode($2, $$.type)" },
      { stepNo: 3, instr: "enterFunctionScope()" },
    ],
  },

  // func_call
  {
    id: 26,
    subId: 1,
    text: "func_call → ID '(' arg_list ')'",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createFuncCallNode($1, $3)" },
    ],
  },

  // arg_list
  {
    id: 27,
    subId: 1,
    text: "arg_list → arg_list ',' expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createArgListNode($1, $3)" },
    ],
  },
  {
    id: 27,
    subId: 2,
    text: "arg_list → expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createArgListNode(NULL, $1)" },
    ],
  },
  {
    id: 27,
    subId: 3,
    text: "arg_list → ε",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = NULL" },
    ],
  },

  // params
  {
    id: 28,
    subId: 1,
    text: "params → params ',' param",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createParamsListNode($1, $3)" },
    ],
  },
  {
    id: 28,
    subId: 2,
    text: "params → param",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createParamsListNode(NULL, $1)" },
    ],
  },
  {
    id: 28,
    subId: 3,
    text: "params → ε",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = NULL" },
    ],
  },

  // param
  {
    id: 29,
    subId: 1,
    text: "param → type_spec ID",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createParamNode($1, $2)" },
    ],
  },
  // expr_stmt
  {
    id: 30,
    subId: 1,
    text: "expr_stmt → expr ;",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },

  // expr (binary)
  {
    id: 31,
    subId: 1,
    text: "expr → expr PLUS expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, +)" },
    ],
  },
  {
    id: 31,
    subId: 2,
    text: "expr → expr MINUS expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, -)" },
    ],
  },
  {
    id: 31,
    subId: 3,
    text: "expr → expr MULT expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, *)" },
    ],
  },
  {
    id: 31,
    subId: 4,
    text: "expr → expr DIV expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, /)" },
    ],
  },
  {
    id: 31,
    subId: 5,
    text: "expr → expr EQ expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, ==)" },
    ],
  },
  {
    id: 31,
    subId: 6,
    text: "expr → expr NEQ expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, !=)" },
    ],
  },
  {
    id: 31,
    subId: 7,
    text: "expr → expr LT expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, <)" },
    ],
  },
  {
    id: 31,
    subId: 8,
    text: "expr → expr GT expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, >)" },
    ],
  },
  {
    id: 31,
    subId: 9,
    text: "expr → expr LEQ expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, <=)" },
    ],
  },
  {
    id: 31,
    subId: 10,
    text: "expr → expr GEQ expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, >=)" },
    ],
  },
  {
    id: 31,
    subId: 11,
    text: "expr → expr AND expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, &&)" },
    ],
  },
  {
    id: 31,
    subId: 12,
    text: "expr → expr OR expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createBinaryExpNode($1, $3, ||)" },
    ],
  },

  // expr (unary)
  {
    id: 31,
    subId: 13,
    text: "expr → NOT expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createUnaryExpNode($2, !)" },
    ],
  },
  {
    id: 31,
    subId: 14,
    text: "expr → MINUS expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createUnaryExpNode($2, -)" },
    ],
  },
  {
    id: 31,
    subId: 15,
    text: "expr → INC expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createUnaryExpNode($2, PRE_INC)" },
    ],
  },
  {
    id: 31,
    subId: 16,
    text: "expr → DEC expr",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createUnaryExpNode($2, PRE_DEC)" },
    ],
  },
  {
    id: 31,
    subId: 17,
    text: "expr → expr INC",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createUnaryExpNode($1, POST_INC)" },
    ],
  },
  {
    id: 31,
    subId: 18,
    text: "expr → expr DEC",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createUnaryExpNode($1, POST_DEC)" },
    ],
  },

  // expr (terminals)
  {
    id: 31,
    subId: 19,
    text: "expr → ID",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTermExpNode(createIdRefNode($1))" },
    ],
  },
  {
    id: 31,
    subId: 20,
    text: "expr → INT_LITERAL",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTermExpNode(createIntLiteralNode($1))" },
    ],
  },
  {
    id: 31,
    subId: 21,
    text: "expr → CHAR_LITERAL",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTermExpNode(createCharLiteralNode($1))" },
    ],
  },
  {
    id: 31,
    subId: 22,
    text: "expr → STR_LITERAL",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = createTermExpNode(createStrLiteralNode($1))" },
    ],
  },
  {
    id: 31,
    subId: 23,
    text: "expr → func_call",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $1" },
    ],
  },
  {
    id: 31,
    subId: 24,
    text: "expr → ( expr )",
    semanticSteps: [
      { stepNo: 1, instr: "$$ = $2" },
    ],
  },
];

// Group by rule ID
const groupedRules = grammarRules.reduce<Record<number, GrammarRule[]>>((acc, rule) => {
  acc[rule.id] = acc[rule.id] || [];
  acc[rule.id].push(rule);
  return acc;
}, {});

const GrammarPanel: React.FC<GrammarPanelProps> = ({
  activeRuleId,
  activeSubRuleId,
  showSemanticSteps = false,
  activeSemanticStep = null,
}) => {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeRuleId, activeSubRuleId, activeSemanticStep]);

  return (
    <div className="h-full flex flex-col font-mono text-sm text-gray-200">
      {/* Header */}
      <div className="bg-neutral-800 p-1">
        <h2 className="font-semibold text-gray-100">Grammar</h2>
        <p className="text-xs text-gray-400">
          Reduce rules grouped by production
        </p>
      </div>

      {/* Rules */}
      <div className="mt-2 space-y-2 overflow-y-auto px-2 flex-1">
        {Object.entries(groupedRules).map(([groupId, rules]) => {
          const isGroupActive = Number(groupId) === activeRuleId;

          return (
            <div
              key={groupId}
              ref={isGroupActive ? activeRef : null}
              className={`
                rounded-sm px-2 py-1 transition-colors
                ${
                  isGroupActive
                    ? "border border-neutral-400 bg-neutral-800"
                    : "bg-neutral-800"
                }
              `}
            >
              {/* Group label */}
              <div className="text-xs text-gray-400 mb-1">
                [{groupId}]
              </div>

              {rules.map((rule, idx) => {
                const isRuleActive =
                  rule.id === activeRuleId &&
                  rule.subId === activeSubRuleId;

                const prefix = idx === 0 ? "" : "  | ";

                return (
                  <div key={`${rule.id}.${rule.subId}`} className="space-y-1">
                    {/* Grammar rule */}
                    <div
                      className={`
                        flex items-start gap-1 px-1 py-[2px]
                        ${
                          isRuleActive
                            ? "bg-neutral-700 border-l-4 border-neutral-400"
                            : ""
                        }
                      `}
                    >
                      <span className="text-gray-500 select-none">
                        {prefix}
                      </span>

                      <span
                        className={
                          isRuleActive
                            ? "text-gray-100 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        {rule.text}
                      </span>
                    </div>

                    {/* Semantic steps */}
                    {showSemanticSteps &&
                      rule.semanticSteps?.map((step) => {
                        const isSemanticActive =
                          Number(activeSemanticStep?.ruleId) === rule.id &&
                          Number(activeSemanticStep?.subRuleId) === rule.subId &&
                          Number(activeSemanticStep?.stepNo) === step.stepNo;

                        // if (isSemanticActive) console.log("Active semantic step: ", step.instr)                        

                        return (
                          <div
                            key={`${rule.id}.${rule.subId}.${step.stepNo}`}
                            className={`
                              ml-6 px-2 py-[2px] text-xs
                              flex items-start gap-2
                              ${
                                isSemanticActive
                                  ? "bg-neutral-600 border-l-4 border-blue-400 text-blue-200"
                                  : "text-gray-500"
                              }
                            `}
                          >
                            <span className="select-none">
                              ▸
                            </span>
                            <span className="whitespace-pre-wrap">
                              {step.instr}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default GrammarPanel;
