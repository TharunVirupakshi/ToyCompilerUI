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
          const isActiveTable = table.id === focusId;
          const lastSymbolIndex = table.symbols.length - 1;

          return (
            <div
              key={table.id}
              ref={isActiveTable ? activeRef : null}
              className={`
                rounded-sm
                px-2
                py-1
                transition-colors
                ${
                  isActiveTable
                    ? "border border-neutral-400 bg-neutral-800"
                    : "bg-neutral-800"
                }
              `}
            >
              {/* Scope header */}
              <div className="flex justify-between items-center mb-1 text-xs text-gray-400">
                <div>
                  Scope #{table.id}
                  {table.parentId !== null && (
                    <span className="text-gray-500">
                      {" "}
                      (parent #{table.parentId})
                    </span>
                  )}
                </div>
                <div>
                  {table.symbols.length} symbol
                  {table.symbols.length !== 1 && "s"}
                </div>
              </div>

              {/* Table */}
              {table.symbols.length === 0 ? (
                <div className="text-xs text-gray-500 italic px-1">
                  no symbols
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b border-neutral-700">
                      <th className="text-left font-normal px-1 py-0.5">sym</th>
                      <th className="text-left font-normal px-1 py-0.5">type</th>
                      <th className="text-center font-normal px-1 py-0.5">func</th>
                      <th className="text-right font-normal px-1 py-0.5">loc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.symbols.map((sym, idx) => {
                      const isNewSymbol =
                        isActiveTable && idx === lastSymbolIndex;

                      return (
                        <tr
                          key={`${sym.name}-${idx}`}
                          className={`
                            ${
                              isNewSymbol
                                ? "bg-neutral-700 border-l-4 border-neutral-400"
                                : ""
                            }
                          `}
                        >
                          <td
                            className={`px-1 py-[2px] ${
                              isNewSymbol
                                ? "text-gray-100 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {sym.name}
                          </td>

                          <td className="px-1 py-[2px] text-gray-400">
                            {sym.type || "—"}
                          </td>

                          <td className="px-1 py-[2px] text-center text-gray-400">
                            {sym.is_function === "1" ? "yes" : "no"}
                          </td>

                          <td className="px-1 py-[2px] text-right text-gray-500">
                            {sym.line_no}:{sym.char_no}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SymbolTablesPane;
