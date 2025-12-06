import { useEffect, useMemo, useRef } from "react";
import { DataSet, Network } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";
import type { SymbolTableRecord } from "../utils/symbolTables";

interface SymbolTablesPaneProps {
  tables: SymbolTableRecord[];
  focusId: number | null;
}

const graphOptions = {
  autoResize: true,
  height: "100%",
  width: "100%",
  interaction: {
    dragNodes: false,
    zoomView: true,
  },
  layout: {
    hierarchical: {
      direction: "UD",
      sortMethod: "directed",
      nodeSpacing: 160,
      levelSeparation: 140,
    },
  },
  physics: {
    enabled: false,
  },
  nodes: {
    shape: "box" as const,
    color: {
      background: "#0f172a",
      border: "#38bdf8",
      highlight: {
        background: "#38bdf8",
        border: "#ffffff",
      },
    },
    font: {
      color: "#e2e8f0",
    },
    borderWidth: 1.5,
  },
  edges: {
    color: "#475569",
    arrows: "to" as const,
  },
};

const SymbolTablesPane = ({ tables, focusId }: SymbolTablesPaneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network | null>(null);

  const data = useMemo(() => {
    const nodes = tables.map((table) => ({
      id: table.id,
      label: `${table.name}\n(#${table.id})`,
    }));
    const edges = tables
      .filter((table) => table.parentId !== null)
      .map((table) => ({
        from: table.parentId as number,
        to: table.id,
      }));
    return { nodes, edges };
  }, [tables]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!networkRef.current) {
      networkRef.current = new Network(
        containerRef.current,
        {
          nodes: new DataSet(data.nodes),
          edges: new DataSet(data.edges),
        },
        graphOptions
      );
    }

    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!networkRef.current) return;
    networkRef.current.setData({
      nodes: new DataSet(data.nodes),
      edges: new DataSet(data.edges),
    });
    if (focusId !== null) {
      networkRef.current.selectNodes([focusId], false);
      networkRef.current.focus(focusId, {
        scale: 1.05,
        animation: { duration: 400, easingFunction: "easeInOutQuad" },
      });
    }
  }, [data, focusId]);

  const focusedTable = tables.find((table) => table.id === focusId);

  return (
    <div className="">
      <div className="">
        <h2 className="panel-title">Symbol tables</h2>
        
      </div>
      <div className=" rounded-lg border border-panel">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="rounded-lg border border-panel p-3 text-sm">
        <div className="">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Focused table
            </p>
            <p className="text-base font-semibold">
              {focusedTable ? focusedTable.name : "—"}
            </p>
            {focusedTable && (
              <p className="text-xs text-muted">table #{focusedTable.id}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted">symbols</p>
            <p className="text-xl font-semibold">{focusedTable ? focusedTable.symbols.length : 0}</p>
          </div>
        </div>
        <div className="">
          {(focusedTable?.symbols.slice(-5).reverse() ?? []).map((sym, idx) => (
            <div
              key={`${sym.name}-${idx}`}
              className="symbol-card"
            >
              <div className="flex justify-between text-sm font-medium">
                <span>{sym.name}</span>
                <span className="text-xs text-muted">
                  {sym.line_no}:{sym.char_no}
                </span>
              </div>
              <div className="text-xs text-muted">
                {sym.type || "untyped"} ·{" "}
                {sym.is_function === "1" ? "function" : "symbol"}
                {sym.is_duplicate === "1" && " · duplicate"}
              </div>
            </div>
          ))}
          {!focusedTable && (
            <p className="text-xs text-muted">
              Step through the log to create scopes and populate symbols.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolTablesPane;

