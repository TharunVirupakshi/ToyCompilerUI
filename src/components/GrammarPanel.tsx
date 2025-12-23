import React, { useEffect, useRef } from "react";

interface GrammarPanelProps {
  activeRuleId?: number; // e.g., 13
  activeSubRuleId?: number; // e.g., 2 for 13.2
}

interface GrammarRule {
  id: number;
  subId: number;
  text: string;
}

const grammarRules: GrammarRule[] = [
  { id: 1, subId: 1, text: "program → stmt_list" },
  { id: 2, subId: 1, text: "stmt_list → stmt_list stmt" },
  { id: 2, subId: 2, text: "stmt_list → ε" },
  { id: 3, subId: 1, text: "stmt → decl_stmt" },
  { id: 3, subId: 2, text: "stmt → assgn_stmt" },
  { id: 3, subId: 3, text: "stmt → expr_stmt" },
  { id: 3, subId: 4, text: "stmt → cond_stmt" },
  { id: 3, subId: 5, text: "stmt → block_stmt" },
  { id: 3, subId: 6, text: "stmt → loop_stmt" },
  { id: 3, subId: 7, text: "stmt → ret_stmt" },
  { id: 3, subId: 8, text: "stmt → func_decl" },
  { id: 3, subId: 9, text: "stmt → func_call_stmt" },
  { id: 3, subId: 10, text: "stmt → break_stmt" },
  { id: 3, subId: 11, text: "stmt → continue_stmt" },
  { id: 3, subId: 12, text: "stmt → ';'" },
  { id: 4, subId: 1, text: "ret_stmt → RETURN expr ;" },
  { id: 4, subId: 2, text: "ret_stmt → RETURN ;" },
  { id: 5, subId: 1, text: "func_call_stmt → func_call ;" },
  { id: 6, subId: 1, text: "assgn_stmt → assgn_expr ;" },
  { id: 6, subId: 2, text: "assgn_expr → ID ASSIGN expr" },
  { id: 7, subId: 1, text: "block_stmt → { stmt_list }" },
  { id: 8, subId: 1, text: "block_stmt_without_scope → { stmt_list }" },
  { id: 9, subId: 1, text: "body → block_stmt_without_scope" },
  { id: 9, subId: 2, text: "body → decl_stmt" },
  { id: 9, subId: 3, text: "body → assgn_stmt" },
  { id: 9, subId: 4, text: "body → expr_stmt" },
  { id: 9, subId: 5, text: "body → cond_stmt" },
  { id: 9, subId: 6, text: "body → loop_stmt" },
  { id: 9, subId: 7, text: "body → ret_stmt" },
  { id: 9, subId: 8, text: "body → func_decl" },
  { id: 9, subId: 9, text: "body → func_call_stmt" },
  { id: 9, subId: 10, text: "body → break_stmt" },
  { id: 9, subId: 11, text: "body → continue_stmt" },
  { id: 9, subId: 12, text: "body → ;" },
  { id: 10, subId: 1, text: "break_stmt → BREAK ;" },
  { id: 11, subId: 1, text: "continue_stmt → CONTINUE ;" },
  { id: 12, subId: 1, text: "cond_stmt → IF '(' expr ')' body else_part" },
  { id: 13, subId: 1, text: "else_part → body" },
  { id: 13, subId: 2, text: "else_part → ε" },
  { id: 14, subId: 1, text: "loop_stmt → WHILE '(' expr ')' body" },
  { id: 14, subId: 2, text: "loop_stmt → FOR '('" },
  { id: 15, subId: 1, text: "for_init → decl" },
  { id: 15, subId: 2, text: "for_init → expr_list" },
  { id: 15, subId: 3, text: "for_init → ε" },
  { id: 16, subId: 1, text: "expr_list → expr_list ',' expr_list_item" },
  { id: 16, subId: 2, text: "expr_list → expr_list_item" },
  { id: 17, subId: 1, text: "expr_list_item → assgn_expr" },
  { id: 17, subId: 2, text: "expr_list_item → expr" },
  { id: 18, subId: 1, text: "for_expr → expr_list" },
  { id: 18, subId: 2, text: "for_expr → ε" },
  { id: 19, subId: 1, text: "decl_stmt → decl ';'" },
  { id: 20, subId: 1, text: "decl → type_spec var_list" },
  { id: 21, subId: 1, text: "type_spec → INT" },
  { id: 21, subId: 2, text: "type_spec → CHAR" },
  { id: 21, subId: 3, text: "type_spec → FLOAT" },
  { id: 21, subId: 4, text: "type_spec → STRING" },
  { id: 22, subId: 1, text: "var_list → var_list ',' var" },
  { id: 22, subId: 2, text: "var_list → var" },
  { id: 23, subId: 1, text: "var → ID" },
  { id: 23, subId: 2, text: "var → ID ASSIGN expr" },
  { id: 24, subId: 1, text: "func_decl → func_header params ')' body" },
  { id: 25, subId: 1, text: "func_header → type_spec ID '('" },
  { id: 25, subId: 2, text: "func_header → VOID ID '('" },
  { id: 26, subId: 1, text: "func_call → ID '(' arg_list ')'" },
  { id: 27, subId: 1, text: "arg_list → arg_list ',' expr" },
  { id: 27, subId: 2, text: "arg_list → expr" },
  { id: 27, subId: 3, text: "arg_list → ε" },
  { id: 28, subId: 1, text: "params → params ',' param" },
  { id: 28, subId: 2, text: "params → param" },
  { id: 28, subId: 3, text: "params → ε" },
  { id: 29, subId: 1, text: "param → type_spec ID" },
  { id: 30, subId: 1, text: "expr_stmt → expr ;" },
  { id: 31, subId: 1, text: "expr → expr PLUS expr" },
  { id: 31, subId: 2, text: "expr → expr MINUS expr" },
  { id: 31, subId: 3, text: "expr → expr MULT expr" },
  { id: 31, subId: 4, text: "expr → expr DIV expr" },
  { id: 31, subId: 5, text: "expr → expr EQ expr" },
  { id: 31, subId: 6, text: "expr → expr NEQ expr" },
  { id: 31, subId: 7, text: "expr → expr LT expr" },
  { id: 31, subId: 8, text: "expr → expr GT expr" },
  { id: 31, subId: 9, text: "expr → expr LEQ expr" },
  { id: 31, subId: 10, text: "expr → expr GEQ expr" },
  { id: 31, subId: 11, text: "expr → expr AND expr" },
  { id: 31, subId: 12, text: "expr → expr OR expr" },
  { id: 31, subId: 13, text: "expr → NOT expr" },
  { id: 31, subId: 14, text: "expr → MINUS expr" },
  { id: 31, subId: 15, text: "expr → INC expr" },
  { id: 31, subId: 16, text: "expr → DEC expr" },
  { id: 31, subId: 17, text: "expr → expr INC" },
  { id: 31, subId: 18, text: "expr → expr DEC" },
  { id: 31, subId: 19, text: "expr → ID" },
  { id: 31, subId: 20, text: "expr → INT_LITERAL" },
  { id: 31, subId: 21, text: "expr → CHAR_LITERAL" },
  { id: 31, subId: 22, text: "expr → STR_LITERAL" },
  { id: 31, subId: 23, text: "expr → func_call" },
  { id: 31, subId: 24, text: "expr → ( expr )" },
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
}) => {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeRuleId, activeSubRuleId]);

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
                rounded-sm
                px-2
                py-1
                transition-colors
                ${
                  isGroupActive
                    ? "border-neutral-400 bg-neutral-800 border-1"
                    : "bg-neutral-800"
                }
              `}
            >
              {/* Group label */}
              <div className="text-xs text-gray-400 mb-1">
                [{groupId}]
              </div>

              {rules.map((rule, idx) => {
                const isActive =
                  rule.id === activeRuleId &&
                  rule.subId === activeSubRuleId;

                const prefix = idx === 0 ? "" : "  | ";

                return (
                  <div
                    key={`${rule.id}.${rule.subId}`}
                    className={`
                      flex items-start gap-1 px-1 py-[2px]
                      ${
                        isActive
                          ? "bg-neutral-700 border-l-4 border-neutral-400"
                          : ""
                      }
                    `}
                  >
                    <span className="text-gray-500 select-none">
                      {prefix}
                    </span>

                    <span
                      className={`
                        ${
                          isActive
                            ? "text-gray-100 font-semibold"
                            : "text-gray-400"
                        }
                      `}
                    >
                      {rule.text}
                    </span>
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
