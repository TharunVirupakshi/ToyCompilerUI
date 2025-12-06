interface InsightsPanelProps {
  logLabel: string;
  stepsCount: number;
  totalScopes: number;
  totalSymbols: number;
}

const InsightsPanel = ({
  logLabel,
  stepsCount,
  totalScopes,
  totalSymbols,
}: InsightsPanelProps) => {
  const cards = [
    { label: "Steps", value: stepsCount },
    { label: "Scopes", value: totalScopes },
    { label: "Symbols", value: totalSymbols },
  ];

  return (
    <div className="flex h-full flex-col text-sm">
      <div>
        <h3 className="panel-title">Log stats</h3>
        <p className="panel-subtitle">Live counters from the loaded snapshot.</p>
      </div>
      <div className="mt-3 space-y-2">
        {cards.map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-md border border-panel px-3 py-2">
            <span className="text-muted uppercase tracking-wide text-xs">{card.label}</span>
            <span className="text-xl text-white">{card.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-dashed border-panel px-3 py-2 text-xs text-muted">
        Source file: <span className="text-white">{logLabel}</span>
      </div>
    </div>
  );
};

export default InsightsPanel;

