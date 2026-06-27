import { useEffect, useRef } from "react";
import type { SemanticPlaybackState } from "../utils/semanticPlayback";
import { formatSemanticName } from "../utils/semanticPlayback";

interface SemanticLoggerPanelProps {
  playback: SemanticPlaybackState;
}

const SemanticLoggerPanel = ({ playback }: SemanticLoggerPanelProps) => {
  const activityEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activityEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [playback.activity.length]);

  return (
    <div className="h-full flex flex-col font-mono text-sm text-gray-200">
      <div className="bg-neutral-800 px-2 py-2 border-b border-neutral-700">
        <h2 className="font-semibold text-gray-100">Semantic Analysis</h2>
        <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <span className="text-gray-500">Current Pass:</span>
          <span className="text-gray-200">
            {playback.currentPass
              ? formatSemanticName(playback.currentPass)
              : "—"}
          </span>
          <span className="text-gray-500">Status:</span>
          <span
            className={
              playback.passState === "Complete"
                ? "text-green-400"
                : playback.passState === "Running"
                  ? "text-blue-300"
                  : "text-gray-400"
            }
          >
            {playback.passState === "Complete" && "✓ "}
            {playback.passState}
          </span>
        </div>
      </div>

      <div className="px-2 py-2 border-b border-neutral-800 text-xs font-semibold text-gray-300">
        Activity Feed
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {playback.activity.length === 0 && (
          <div className="rounded-sm bg-neutral-800 px-3 py-2 text-xs text-gray-400">
            Click <span className="font-semibold">START</span> to begin semantic
            analysis.
          </div>
        )}
        <div className="space-y-1">
          {playback.activity.map((entry) => (
            <div
              key={entry.stepIndex}
              className={`rounded-sm border-l-2 bg-neutral-800 px-2 py-1.5 text-xs ${
                entry.tone === "error"
                  ? "border-red-500 text-red-300"
                  : entry.tone === "success"
                    ? "border-green-500 text-green-300"
                    : entry.tone === "pass"
                      ? "border-violet-400 bg-violet-950/40 text-violet-200"
                    : "border-neutral-600 text-gray-300"
              }`}
            >
              <div className="flex items-start gap-2">
                <span aria-hidden="true">{entry.icon}</span>
                <div className="min-w-0">
                  <div>{entry.message}</div>
                  {entry.detail && (
                    <div className="mt-1 whitespace-pre-wrap text-gray-400">
                      {entry.detail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div ref={activityEndRef} />
      </div>
    </div>
  );
};

export default SemanticLoggerPanel;
