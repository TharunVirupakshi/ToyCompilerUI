import { useEffect, useRef } from "react";
import type { SymbolTableRecord } from "../utils/symbolTables";

interface SymbolTablesPaneProps {
  tables: SymbolTableRecord[];
  focusId: number | null;
}

const SymbolTablesPane = ({ tables, focusId }: SymbolTablesPaneProps) => {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusId]);

  const hasData = tables.length > 0;

  return (
    <div className="h-full flex flex-col font-mono text-sm text-gray-200">
      {/* Header */}
      <div className="bg-neutral-800 p-1">
        <h2 className="font-semibold text-gray-100">Symbol Tables</h2>
        <p className="text-xs text-gray-400">
          Scopes created during parsing
        </p>
      </div>

      {/* Content */}
      <div className="mt-2 space-y-2 overflow-y-auto px-2 flex-1">
        {!hasData && (
          <div className="text-xs text-gray-400 px-2 py-1">
            Click <span className="font-semibold">START</span> to begin execution
            and create scopes.
          </div>
        )}

        {tables.map((table) => {
          const isActive = table.id === focusId;

          return (
            <div
              key={table.id}
              ref={isActive ? activeRef : null}
              className={`
                rounded-sm
                px-2
                py-1
                transition-colors
                ${
                  isActive
                    ? "border-neutral-400 bg-neutral-800 border"
                    : "bg-neutral-800"
                }
              `}
            >
              {/* Scope header */}
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-400">
                  Scope #{table.id}
                  {table.parentId !== null && (
                    <span className="text-gray-500">
                      {" "}
                      (parent #{table.parentId})
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  {table.symbols.length} symbol
                  {table.symbols.length !== 1 && "s"}
                </div>
              </div>

              {/* Symbols */}
              {table.symbols.length === 0 && (
                <div className="text-xs text-gray-500 italic px-1">
                  no symbols
                </div>
              )}

            {table.symbols.map((sym, idx) => {
              const isNewSymbol =
                table.id === focusId && idx === table.symbols.length - 1;

              return (
                <div
                  key={`${sym.name}-${idx}`}
                  className={`
                    flex justify-between px-1 py-[2px]
                    ${
                      isNewSymbol
                        ? "bg-neutral-700 border-l-4 border-neutral-400"
                        : ""
                    }
                  `}
                >
                  <span
                    className={`
                      ${
                        isNewSymbol
                          ? "text-gray-100 font-medium"
                          : "text-gray-400"
                      }
                    `}
                  >
                    {sym.name}
                  </span>

                  <span className="text-xs text-gray-500">
                    {sym.type || "untyped"}
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

export default SymbolTablesPane;
