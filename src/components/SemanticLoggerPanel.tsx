const SemanticLoggerPanel = () => {
  return (
    <div className="h-full flex flex-col font-mono text-sm text-gray-200">
      <div className="bg-neutral-800 p-1 border-b border-neutral-700">
        <h2 className="font-semibold text-gray-100">Semantic Logger</h2>
        <p className="text-xs text-gray-400">Semantic messages will appear here</p>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto px-2">
        <div className="rounded-sm bg-neutral-800 px-3 py-2 text-xs text-gray-400">
          Switch to semantic phase to use this panel. Log rendering is not wired yet.
        </div>
      </div>
    </div>
  );
};

export default SemanticLoggerPanel;
