import type { Step } from "../types/steps";

interface StepTimelineProps {
  steps: Step[];
  currentStepIndex: number;
}

const StepTimeline = ({ steps, currentStepIndex }: StepTimelineProps) => {
  const windowStart = Math.max(currentStepIndex - 3, 0);
  const windowEnd = Math.min(currentStepIndex + 7, steps.length);
  const items = steps.slice(windowStart, windowEnd);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2">
        <h3 className="panel-title">Timeline</h3>
        <p className="panel-subtitle">Parser events around the current step.</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {items.map((step, idx) => {
          const absoluteIndex = windowStart + idx;
          const isActive = absoluteIndex === currentStepIndex;
          return (
            <div
              key={`${step.type}-${absoluteIndex}`}
              className={`timeline-item ${isActive ? "timeline-item--active" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">
                  #{absoluteIndex + 1}
                </span>
                <span className="text-xs uppercase tracking-wide">
                  {step.type.replace(/^PARSE_/, "").replace(/_/g, " ")}
                </span>
              </div>
              {step.type === "PARSE_REDUCE_RULE" && (
                <p className="mt-1 text-xs text-slate-200">
                  {(step.data as { rule?: string }).rule}
                </p>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted">Load a log to see step details.</p>
        )}
      </div>
    </div>
  );
};

export default StepTimeline;

