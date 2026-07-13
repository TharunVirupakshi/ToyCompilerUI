import type {
  ICGBackpatchAnimation,
  ICGPendingListView,
} from "../utils/icgPlayback";

interface BackpatchListsPaneProps {
  lists: ICGPendingListView[];
  animation: ICGBackpatchAnimation | null;
  onSelectInstruction: (instructionNo: number) => void;
}

const LIST_TYPES = ["trueList", "falseList", "nextList"] as const;

const typeStyles: Record<string, string> = {
  trueList: "border-green-500/70 bg-green-950/20 text-green-200",
  falseList: "border-red-500/70 bg-red-950/20 text-red-200",
  nextList: "border-amber-500/70 bg-amber-950/20 text-amber-200",
};

const emptyCopy: Record<string, string> = {
  trueList: "No pending true jumps",
  falseList: "No pending false jumps",
  nextList: "No pending fallthrough jumps",
};

const formatRefs = (instructionNos: number[]) =>
  instructionNos.length > 0
    ? instructionNos.map((instructionNo) => `#${instructionNo}`).join(", ")
    : "empty";

const BackpatchListsPane = ({
  lists,
  animation,
  onSelectInstruction,
}: BackpatchListsPaneProps) => {
  const groupedLists = LIST_TYPES.map((listType) => ({
    listType,
    lists: lists.filter((list) => list.listType === listType),
  }));

  const unknownLists = lists.filter(
    (list) => !LIST_TYPES.includes(list.listType as (typeof LIST_TYPES)[number])
  );

  return (
    <div className="h-full min-h-0 flex flex-col font-mono text-sm text-gray-200">
      <div className="shrink-0 bg-neutral-800 p-2 border-b border-neutral-700">
        <h2 className="font-semibold text-gray-100">Backpatch Lists</h2>
        <p className="text-xs text-gray-400">
          Pending jump slots created during boolean/control-flow lowering
        </p>
      </div>

      <div className="shrink-0 border-b border-neutral-800 p-2">
        {animation ? (
          <div className="px-2 py-1.5 text-xs text-gray-300">
            {animation.kind === "create" && (
              <>
                <div>Create {animation.listName}</div>
                <code className="text-gray-400">
                  {formatRefs(animation.instructionNos)}
                </code>
              </>
            )}
            {animation.kind === "merge" && (
              <>
                <div>
                  Merge {animation.leftName} + {animation.rightName} →{" "}
                  {animation.listName}
                </div>
                <code className="text-gray-400">
                  {formatRefs(animation.leftInstructionNos)} +{" "}
                  {formatRefs(animation.rightInstructionNos)} →{" "}
                  {formatRefs(animation.resultInstructionNos)}
                </code>
              </>
            )}
            {animation.kind === "backpatch" && (
              <>
                <div>
                  Backpatch {animation.listName}: #{animation.instructionNo}
                </div>
                <code className="text-gray-400">
                  blank target → {animation.targetLabel}
                </code>
              </>
            )}
            {animation.kind === "filled" && (
              <>
                <div>
                  Filled {animation.listName}: #{animation.instructionNo}
                </div>
                <code className="text-gray-400">
                  target = {animation.targetLabel}
                </code>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-sm bg-neutral-800 px-2 py-1.5 text-xs text-gray-500">
            List operations will appear here during ICG playback.
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {[...groupedLists, ...(unknownLists.length > 0 ? [{ listType: "other", lists: unknownLists }] : [])].map(
            ({ listType, lists: typedLists }) => (
              <section
                key={listType}
                className="rounded-sm border border-neutral-800 bg-neutral-900/70"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 px-2 py-1.5">
                  <span className="text-xs font-semibold text-gray-200">
                    {listType}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">
                    {typedLists.length} pending
                  </span>
                </div>

                <div className="space-y-1 p-2">
                  {typedLists.length === 0 && (
                    <div className="text-xs text-gray-600">
                      {emptyCopy[listType] ?? "No pending lists"}
                    </div>
                  )}

                  {typedLists.map((list) => {
                    const isActive =
                      animation &&
                      "listName" in animation &&
                      animation.listName === list.name;
                    return (
                      <div
                        key={list.id}
                        className={`rounded-sm border-l-2 px-2 py-1.5 transition-colors ${
                          typeStyles[list.listType] ??
                          "border-neutral-600 bg-neutral-800 text-gray-300"
                        } ${isActive ? "ring-1 ring-blue-400/70" : ""}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">
                            {list.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide opacity-70">
                            {list.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {list.slots.map((slot) => (
                            <button
                              key={`${list.id}-${slot.instructionNo}`}
                              type="button"
                              className={`rounded border px-1.5 py-0.5 text-xs transition-colors ${
                                slot.status === "patching"
                                  ? "border-blue-300 bg-blue-500/20 text-blue-100 animate-pulse"
                                  : "border-neutral-600 bg-neutral-950/60 text-gray-200 hover:border-blue-400 hover:text-blue-200"
                              }`}
                              onClick={() =>
                                onSelectInstruction(slot.instructionNo)
                              }
                              title={
                                slot.targetLabel
                                  ? `Patch target ${slot.targetLabel}`
                                  : `Scroll TAC to #${slot.instructionNo}`
                              }
                            >
                              #{slot.instructionNo}
                              {slot.targetLabel ? ` → ${slot.targetLabel}` : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BackpatchListsPane;
