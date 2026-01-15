import { FC, useEffect, useMemo, useRef } from "react";
import type { ParserState } from "../types/states";

export type SymbolData = {
  displayValue: string;
  value: string;
};
interface ParserStatesPanelProps {
  states: ParserState[];

  /** From PARSE_STACK_SNAPSHOT */
  stateStack: number[];

  /** Parallel symbol stack */
  symbolStack: SymbolData[];

  /** Lookahead terminal (from lexer / parser) */
  lookahead?: SymbolData | null;

  /** Reduce visualization */
  reduceCount?: number; // RHS length

  highlightReduce: boolean;

  highlightReduceComplete: boolean;
}

const ParserStatesPanel: FC<ParserStatesPanelProps> = ({
  states,
  stateStack = [],
  symbolStack = [],
  reduceCount,
  lookahead,
  highlightReduce = false,
  highlightReduceComplete = false,
}) => {
  const activeRef = useRef<HTMLDivElement | null>(null);

  /** Top of LR stack = active state */
  const activeState = useMemo(() => {
      if (!stateStack || stateStack.length === 0) return null;
      return stateStack[stateStack.length - 1];
    }, [stateStack]);

    const topSymbol = useMemo(() => {
      if (!symbolStack.length) return null;
      return symbolStack[symbolStack.length - 1];
    }, [symbolStack]);

    const highlightedAction: {
      state: number;
      kind: "shift" | "goto" | "default" | null;
      index?: number;
    } | null = useMemo(() => {
      console.log("Active state: ", activeState)
      if (activeState == null) return null;

      const state = states.find((s) => s.state === activeState);
      console.log("State info: ", state)
      if (!state) return null;

      /* 🔴 REDUCE IN PROGRESS */
      if (highlightReduce || highlightReduceComplete) {
        if (topSymbol) {
          const gotoIdx = state.gotos.findIndex((g) => g.symbol === topSymbol.value);

          if (gotoIdx !== -1) {
            console.log("GOTO action")
            return {
              state: activeState,
              kind: "goto",
              index: gotoIdx,
            };
          }
        }

        console.log("DEFAULT action after Reduce")
        // fallback → default reduce
        return {
          state: activeState,
          kind: "default",
        };
      }

      /* 🟢 NORMAL SHIFT MODE */
      if (lookahead) {
        const shiftIdx = state.shifts.findIndex(
          (s) => s.symbol === lookahead.value
        );

        if (shiftIdx !== -1) {
          console.log("SHIFT action")
          return {
            state: activeState,
            kind: "shift",
            index: shiftIdx,
          };
        }
      }

      /* ⚪ DEFAULT */
      if (state.default) {
        console.log("DEFAULT action")
        return {
          state: activeState,
          kind: "default",
        };
      }

      console.log("Retruning NULL")
      return null;
    }, [
      activeState,
      topSymbol,
      states,
      symbolStack,
      lookahead,
      highlightReduce,
      highlightReduceComplete,
    ]);

    useEffect(() => {
      if (activeRef.current) {
        activeRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [activeState]);

  return (
    <div className="h-full flex flex-col font-mono text-sm text-gray-200">
      {/* Header */}
      <div className="bg-neutral-800 p-1 border-b border-neutral-700">
        <h2 className="font-semibold text-gray-100">Parser States</h2>
        {/* <p className="text-xs text-gray-400">
          LR items, shifts, gotos, default actions
        </p> */}
      </div>

      {/* 🔒 Sticky Stack Bar */}
      <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-700 px-2 py-2 space-y-1">
        {/* State Stack */}
        <StackRow
          label="States"
          items={stateStack}
          highlightCount={reduceCount}
          highlightReduce={highlightReduce}
        />

        <div className="flex">
          {/* Symbol Stack */}
          <div className="flex-1">
            <StackRow
              label="Symbols"
              items={symbolStack.map((item) => item.value)}
              highlightCount={reduceCount}
              highlightReduce={highlightReduce}
            />
          </div>
          {/* Lookahead */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Lookahead:</span>
            {lookahead && (
              <span className="px-2 py-[2px] bg-neutral-800 border border-neutral-700 rounded-sm">
                {lookahead.displayValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* States list */}
      <div className="mt-2 space-y-2 overflow-y-auto px-2 flex-1">
        {states.map((st) => {
          const isActive = st.state === activeState;
          var isAlreadyHighlighted = false;
          return (
            <div
              key={st.state}
              ref={isActive ? activeRef : null}
              className={`
                rounded-sm px-2 py-2 transition-colors
                ${
                  isActive
                    ? "border border-neutral-400 bg-neutral-800"
                    : "bg-neutral-800"
                }
              `}
            >
              {/* State label */}
              <div className="text-xs text-gray-400 mb-2">State {st.state}</div>

              {/* Items */}
              <div className="space-y-[2px]">
                {st.items.map((it, idx) => (
                  <div key={`${st.state}-item-${idx}`} className="px-1">
                    <span className="text-gray-500 mr-2">{it.rule}</span>
                    <span className="text-gray-300">{it.item}</span>
                  </div>
                ))}
              </div>

              {/* Actions table */}
              {(st.shifts.length > 0 || st.gotos.length > 0 || st.default) && (
                <div className="mt-3 text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-700 text-gray-400">
                        <th className="text-left font-normal px-2 py-1">
                          Symbol
                        </th>
                        <th className="text-left font-normal px-2 py-1">
                          Shift / Reduce
                        </th>
                        <th className="text-left font-normal px-2 py-1">
                          Goto
                        </th>
                      </tr>
                    </thead>

                    <tbody className="text-gray-300">
                      {/* SHIFTS */}
                      {st.shifts.map((s, idx) => {
                        const isHighlighted =
                          isActive &&
                          highlightedAction?.kind === "shift" &&
                          highlightedAction.state === st.state &&
                          highlightedAction.index === idx;

                        return (
                          <tr
                            key={`shift-${idx}`}
                            className={isHighlighted ? "bg-neutral-700" : ""}
                          >
                            <td className="px-2 py-1">{s.symbol}</td>
                            <td className="px-2 py-1">shift</td>
                            <td className="px-2 py-1">{s.to}</td>
                          </tr>
                        );
                      })}

                      {/* GOTOS */}
                      {st.gotos.map((g, idx) => {
                        const isHighlighted =
                          isActive &&
                          highlightedAction?.kind === "goto" &&
                          highlightedAction.state === st.state &&
                          highlightedAction.index === idx;

                        return (
                          <tr
                            key={`goto-${idx}`}
                            className={isHighlighted ? "bg-neutral-700" : ""}
                          >
                            <td className="px-2 py-1">{g.symbol}</td>
                            <td className="px-2 py-1">-</td>
                            <td className="px-2 py-1">{g.to}</td>
                          </tr>
                        );
                      })}

                      {/* DEFAULT */}
                      {st.default && (
                        <tr
                          className={
                            isActive &&
                            highlightedAction?.kind === "default" &&
                            highlightedAction.state === st.state
                              ? "bg-neutral-700"
                              : ""
                          }
                        >
                          <td className="px-2 py-1">$default</td>
                          <td className="px-2 py-1">
                            {st.default.action === "reduce"
                              ? `reduce (${st.default.rule})`
                              : "accept"}
                          </td>
                          <td className="px-2 py-1">-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParserStatesPanel;

interface StackRowProps {
  label: string;
  items: (string | number)[];
  highlightCount?: number;
  highlightReduce: boolean;
}

const StackRow: FC<StackRowProps> = ({
  label,
  items,
  highlightCount = 0,
  highlightReduce = false,
}) => {
  const startHighlight = items.length - highlightCount;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* 🔁 Always keep stack scrolled to the right */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [items.length]);

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Label */}
      <span className="text-gray-400 w-14 shrink-0">{label}:</span>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900"
      >
        {items.map((item, idx) => {
          const isHighlighted = idx >= startHighlight && highlightReduce;
          const isTop = idx === items.length - 1;

          return (
            <div
              key={`${label}-${idx}`}
              className={`
                px-2 py-[2px] rounded-sm border whitespace-nowrap shrink-0
                ${
                  isHighlighted
                    ? "border-red-600 bg-red-400 text-gray-100"
                    : isTop
                    ? "border-blue-600 bg-blue-400 text-gray-100"
                    : "border-neutral-700 bg-neutral-800 text-gray-400"
                }
              `}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};
