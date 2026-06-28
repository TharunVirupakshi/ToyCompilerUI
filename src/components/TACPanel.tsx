import { useEffect, useRef } from "react";
import type { TACInstructionView } from "../utils/icgPlayback";

interface TACPanelProps {
  instructions: TACInstructionView[];
  activeInstructionNo: number | null;
}

const TACPanel = ({
  instructions,
  activeInstructionNo,
}: TACPanelProps) => {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeInstructionNo]);

  return (
    <div className="h-full min-h-0 flex flex-col font-mono text-sm text-gray-200">
      <div className="shrink-0 bg-neutral-800 p-2 border-b border-neutral-700">
        <h2 className="font-semibold text-gray-100">
          Three Address Code (TAC)
        </h2>
        <p className="text-xs text-gray-400">
          Instructions appear as AST nodes are lowered
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {instructions.length === 0 && (
          <div className="rounded-sm bg-neutral-800 px-3 py-2 text-xs text-gray-400">
            Start ICG playback to generate instructions.
          </div>
        )}
        <div className="space-y-1">
          {instructions.map((instruction) => {
            const isActive =
              instruction.instructionNo === activeInstructionNo;
            const isLabel = instruction.opcode === "LABEL";

            return (
              <div
                key={instruction.instructionNo}
                ref={isActive ? activeRef : null}
                className={`grid grid-cols-[3rem_1fr] gap-2 rounded-sm border-l-2 px-2 py-1.5 transition-colors ${
                  isActive
                    ? "border-blue-400 bg-blue-950/60 text-blue-100"
                    : isLabel
                      ? "border-violet-500 bg-violet-950/30 text-violet-300"
                      : "border-transparent bg-neutral-800 text-gray-300"
                }`}
              >
                <span className="text-right text-xs text-gray-500">
                  {instruction.instructionNo}
                </span>
                <code className={isLabel ? "font-semibold" : ""}>
                  {instruction.text}
                </code>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TACPanel;
