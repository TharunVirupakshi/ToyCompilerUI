import { useEffect, useRef } from "react";
import type { ICGActivityEntry } from "../utils/icgPlayback";

interface ICGLoggerPanelProps {
  activity: ICGActivityEntry[];
}

const ICGLoggerPanel = ({ activity }: ICGLoggerPanelProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activity.length]);

  return (
    <div className="h-full min-h-0 flex flex-col font-mono text-sm text-gray-200">
      <div className="shrink-0 bg-neutral-800 p-2 border-b border-neutral-700">
        <h2 className="font-semibold text-gray-100">ICG Logger</h2>
        <p className="text-xs text-gray-400">
          How AST nodes become intermediate instructions
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {activity.length === 0 && (
          <div className="rounded-sm bg-neutral-800 px-3 py-2 text-xs text-gray-400">
            Click <span className="font-semibold">START</span> to begin ICG.
          </div>
        )}
        <div className="space-y-1">
          {activity.map((entry) => (
            <div
              key={entry.stepIndex}
              className={`rounded-sm border-l-2 bg-neutral-800 px-2 py-1.5 text-xs ${
                entry.tone === "emit"
                  ? "border-blue-500 text-blue-200"
                  : entry.tone === "create"
                    ? "border-violet-500 text-violet-200"
                    : entry.tone === "success"
                      ? "border-green-500 text-green-300"
                      : "border-neutral-600 text-gray-300"
              }`}
            >
              <div>{entry.message}</div>
              {entry.detail && (
                <code className="mt-1 block whitespace-pre-wrap text-gray-400">
                  {entry.detail}
                </code>
              )}
            </div>
          ))}
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default ICGLoggerPanel;
