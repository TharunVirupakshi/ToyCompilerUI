import React, { useEffect, useRef } from "react";
import type { ParseSemanticStepData } from "../types/steps";
import type { GrammarRule } from "../types/grammar";
import { grammarJson } from "../data"

interface GrammarPanelProps {
  activeRuleNo?: number; // ruleNo
  /** semantic view controls */
  showSemanticSteps?: boolean;
  activeSemanticStep?: ParseSemanticStepData | null;
}

const grammarRules: GrammarRule[] = grammarJson;

/* Group by ruleNo */
const groupedRules = grammarRules.reduce<Record<number, GrammarRule[]>>(
  (acc, rule) => {
    acc[rule.ruleNo] = acc[rule.ruleNo] || [];
    acc[rule.ruleNo].push(rule);
    return acc;
  },
  {}
);

const GrammarPanel: React.FC<GrammarPanelProps> = ({
  activeRuleNo,
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
  }, [activeRuleNo, activeSemanticStep]);

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
        {Object.entries(groupedRules).map(([ruleNo, rules]) => {
          const numericRuleNo = Number(ruleNo);
          const isGroupActive = numericRuleNo === activeRuleNo;

          return (
            <div
              key={ruleNo}
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
                [{ruleNo}]
              </div>

              {rules.map((rule, idx) => {
                const isRuleActive = rule.ruleNo === activeRuleNo;
                const prefix = idx === 0 ? "" : "  | ";

                return (
                  <div key={rule.ruleNo} className="space-y-1">
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
                      rule.semanticSteps.map((step) => {
                        const isSemanticActive =
                          Number(activeSemanticStep?.ruleNo) === rule.ruleNo &&
                          Number(activeSemanticStep?.stepNo) === step.stepNo;

                        return (
                          <div
                            key={`${rule.ruleNo}.${step.stepNo}`}
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
                            <span className="select-none">▸</span>
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
