import type {
  ICGCompleteData,
  ICGCreateLabelData,
  ICGCreateTempData,
  ICGEmitData,
  ICGFunctionData,
  ICGListEventData,
  ICGNodeVisitData,
  ICGOriginData,
  ICGPatchLabelData,
  Step,
} from "../types/steps";

export interface TACInstructionView {
  instructionNo: number;
  opcode: string;
  text: string;
  astNodeId: number | null;
}

export type ICGListType = "trueList" | "falseList" | "nextList" | string;

export interface ICGListSlot {
  instructionNo: number;
  status: "pending" | "patching";
  targetLabel?: string;
}

export interface ICGPendingListView {
  id: string;
  name: string;
  listType: ICGListType;
  slots: ICGListSlot[];
  status: "pending" | "created" | "merged" | "backpatching";
}

export type ICGBackpatchAnimation =
  | {
      kind: "create";
      stepIndex: number;
      listName: string;
      listType: ICGListType;
      instructionNos: number[];
    }
  | {
      kind: "merge";
      stepIndex: number;
      listName: string;
      listType: ICGListType;
      leftName: string;
      rightName: string;
      leftInstructionNos: number[];
      rightInstructionNos: number[];
      resultInstructionNos: number[];
    }
  | {
      kind: "backpatch";
      stepIndex: number;
      listName: string;
      listType: ICGListType;
      instructionNo: number;
      targetLabel: string;
    }
  | {
      kind: "filled";
      stepIndex: number;
      listName: string;
      listType: ICGListType;
      instructionNo: number;
      targetLabel: string;
    };

export interface ICGActivityEntry {
  stepIndex: number;
  tone: "info" | "create" | "emit" | "success";
  message: string;
  detail?: string;
}

export interface ICGPlaybackState {
  instructions: TACInstructionView[];
  activity: ICGActivityEntry[];
  activeInstructionNo: number | null;
  activeNodeId: number | null;
  pendingLists: ICGPendingListView[];
  activeBackpatchAnimation: ICGBackpatchAnimation | null;
  activeBackpatchInstructionNo: number | null;
  activeBackpatchLabel: string | null;
  complete: ICGCompleteData | null;
}

const toNumber = (value: string | number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const originNodeId = (data: ICGOriginData) =>
  toNumber(data.ast_node_id);

const visitMessage = (data: ICGNodeVisitData) => {
  const readableType = data.node_type.replaceAll("_", " ");
  return data.operator
    ? `Visit ${readableType} (${data.operator})`
    : `Visit ${readableType}`;
};

const parseInstructionRefs = (value?: string) =>
  Array.from(value?.matchAll(/#?(\d+)/g) ?? [])
    .map((match) => Number(match[1]))
    .filter((instructionNo) => Number.isFinite(instructionNo));

const sameInstructionSet = (left: number[], right: number[]) => {
  if (left.length !== right.length) return false;
  const normalizedLeft = [...left].sort((a, b) => a - b);
  const normalizedRight = [...right].sort((a, b) => a - b);
  return normalizedLeft.every(
    (instructionNo, index) => instructionNo === normalizedRight[index]
  );
};

const listInstructionNos = (list: ICGPendingListView) =>
  list.slots.map((slot) => slot.instructionNo);

const formatListName = (listType: string, count: number) =>
  `${listType}${count}`;

export const deriveICGPlaybackState = (
  steps: Step[],
  currentStepIndex: number
): ICGPlaybackState => {
  const state: ICGPlaybackState = {
    instructions: [],
    activity: [],
    activeInstructionNo: null,
    activeNodeId: null,
    pendingLists: [],
    activeBackpatchAnimation: null,
    activeBackpatchInstructionNo: null,
    activeBackpatchLabel: null,
    complete: null,
  };

  const upperBound = Math.min(currentStepIndex, steps.length - 1);
  if (upperBound < 0) return state;

  const instructionByNo = new Map<number, TACInstructionView>();
  const listCounters = new Map<string, number>();

  const nextListName = (listType: string) => {
    const next = (listCounters.get(listType) ?? 0) + 1;
    listCounters.set(listType, next);
    return formatListName(listType, next);
  };

  const findList = (listType: string, instructionNos: number[]) =>
    state.pendingLists.find(
      (list) =>
        list.listType === listType &&
        sameInstructionSet(listInstructionNos(list), instructionNos)
    ) ?? null;

  const findListContaining = (listType: string, instructionNo: number) =>
    state.pendingLists.find(
      (list) =>
        list.listType === listType &&
        list.slots.some((slot) => slot.instructionNo === instructionNo)
    ) ?? null;

  steps.slice(0, upperBound + 1).forEach((step, stepIndex) => {
    switch (step.type) {
      case "ICG_NODE_VISIT": {
        const data = step.data as ICGNodeVisitData;
        state.activeNodeId = originNodeId(data);
        state.activeBackpatchInstructionNo = null;
        state.activeBackpatchLabel = null;
        state.activity.push({
          stepIndex,
          tone: "info",
          message: visitMessage(data),
        });
        break;
      }
      case "ICG_CREATE_TEMP": {
        const data = step.data as ICGCreateTempData;
        state.activeNodeId = originNodeId(data);
        state.activeBackpatchInstructionNo = null;
        state.activeBackpatchLabel = null;
        state.activity.push({
          stepIndex,
          tone: "create",
          message: `Create temporary ${data.temp_name}`,
        });
        break;
      }
      case "ICG_CREATE_LABEL": {
        const data = step.data as ICGCreateLabelData;
        state.activeNodeId = originNodeId(data);
        state.activeBackpatchInstructionNo = null;
        state.activeBackpatchLabel = null;
        state.activity.push({
          stepIndex,
          tone: "create",
          message: `Create label ${data.label_name}`,
        });
        break;
      }
      case "ICG_EMIT": {
        const data = step.data as ICGEmitData;
        const instructionNo = toNumber(data.instruction_no);
        state.activeNodeId = originNodeId(data);
        if (instructionNo !== null) {
          const instruction: TACInstructionView = {
            instructionNo,
            opcode: data.opcode,
            text: data.text,
            astNodeId: state.activeNodeId,
          };
          instructionByNo.set(instructionNo, instruction);
          state.instructions.push(instruction);
          state.activeInstructionNo = instructionNo;
        }
        state.activeBackpatchInstructionNo = null;
        state.activeBackpatchLabel = null;
        state.activity.push({
          stepIndex,
          tone: "emit",
          message: "Emit",
          detail: data.text,
        });
        break;
      }
      case "ICG_PATCH_LABEL": {
        const data = step.data as ICGPatchLabelData;
        const instructionNo = toNumber(data.instruction_no);
        state.activeNodeId = originNodeId(data);
        if (instructionNo !== null) {
          const instruction = instructionByNo.get(instructionNo);
          if (instruction) instruction.text = data.text;
          state.activeInstructionNo = instructionNo;
          state.activeBackpatchInstructionNo = instructionNo;
          state.activeBackpatchLabel = data.label_name;
          const matchingList = state.pendingLists.find((list) =>
            list.slots.some((slot) => slot.instructionNo === instructionNo)
          );
          const listName = matchingList?.name ?? "patched list";
          const listType = matchingList?.listType ?? "nextList";
          state.activeBackpatchAnimation = {
            kind: "filled",
            stepIndex,
            listName,
            listType,
            instructionNo,
            targetLabel: data.label_name,
          };
          if (matchingList) {
            matchingList.slots = matchingList.slots.filter(
              (slot) => slot.instructionNo !== instructionNo
            );
            state.pendingLists = state.pendingLists.filter(
              (list) => list.slots.length > 0
            );
          }
        }
        state.activity.push({
          stepIndex,
          tone: "create",
          message: `Patch jump with ${data.label_name}`,
          detail: data.text,
        });
        break;
      }
      case "ICG_LIST_CREATE": {
        const data = step.data as ICGListEventData;
        state.activeNodeId = originNodeId(data);
        const instructionNos = parseInstructionRefs(data.instructions);
        const listName = nextListName(data.list_type);
        if (instructionNos.length > 0) {
          state.pendingLists.push({
            id: `${listName}-${stepIndex}`,
            name: listName,
            listType: data.list_type,
            slots: instructionNos.map((instructionNo) => ({
              instructionNo,
              status: "pending",
            })),
            status: "created",
          });
          state.activeBackpatchAnimation = {
            kind: "create",
            stepIndex,
            listName,
            listType: data.list_type,
            instructionNos,
          };
        }
        state.activity.push({
          stepIndex,
          tone: "create",
          message: `Create ${data.list_type}`,
          detail: data.instructions ? `pending: ${data.instructions}` : undefined,
        });
        break;
      }
      case "ICG_LIST_MERGE": {
        const data = step.data as ICGListEventData;
        state.activeNodeId = originNodeId(data);
        const leftInstructionNos = parseInstructionRefs(data.left);
        const rightInstructionNos = parseInstructionRefs(data.right);
        const resultInstructionNos = parseInstructionRefs(data.result);
        const leftList = findList(data.list_type, leftInstructionNos);
        const rightList = findList(data.list_type, rightInstructionNos);
        const leftName = leftList?.name ?? data.list_type;
        const rightName = rightList?.name ?? data.list_type;
        state.pendingLists = state.pendingLists.filter(
          (list) => list !== leftList && list !== rightList
        );
        const listName = nextListName(data.list_type);
        if (resultInstructionNos.length > 0) {
          state.pendingLists.push({
            id: `${listName}-${stepIndex}`,
            name: listName,
            listType: data.list_type,
            slots: resultInstructionNos.map((instructionNo) => ({
              instructionNo,
              status: "pending",
            })),
            status: "merged",
          });
          state.activeBackpatchAnimation = {
            kind: "merge",
            stepIndex,
            listName,
            listType: data.list_type,
            leftName,
            rightName,
            leftInstructionNos,
            rightInstructionNos,
            resultInstructionNos,
          };
        }
        state.activity.push({
          stepIndex,
          tone: "create",
          message: `Merge ${data.list_type}`,
          detail: `${data.left ?? "empty"} + ${data.right ?? "empty"} → ${data.result ?? "empty"}`,
        });
        break;
      }
      case "ICG_BACKPATCH": {
        const data = step.data as ICGListEventData;
        state.activeNodeId = originNodeId(data);
        const instructionNos = parseInstructionRefs(data.instructions);
        const instructionNo = instructionNos[0] ?? null;
        const targetLabel = data.label_name ?? `instruction ${data.target_tac_id}`;
        if (instructionNo !== null) {
          let list = findListContaining(data.list_type, instructionNo);
          if (!list) {
            const listName = nextListName(data.list_type);
            list = {
              id: `${listName}-${stepIndex}`,
              name: listName,
              listType: data.list_type,
              slots: [
                {
                  instructionNo,
                  status: "pending",
                },
              ],
              status: "created",
            };
            state.pendingLists.push(list);
          }
          const listName = list?.name ?? data.list_type;
          list.status = "backpatching";
          list.slots = list.slots.map((slot) =>
            slot.instructionNo === instructionNo
              ? { ...slot, status: "patching", targetLabel }
              : slot
          );
          state.activeInstructionNo = instructionNo;
          state.activeBackpatchInstructionNo = instructionNo;
          state.activeBackpatchLabel = targetLabel;
          state.activeBackpatchAnimation = {
            kind: "backpatch",
            stepIndex,
            listName,
            listType: data.list_type,
            instructionNo,
            targetLabel,
          };
        }
        state.activity.push({
          stepIndex,
          tone: "create",
          message: `Backpatch ${data.list_type}`,
          detail: `${data.instructions ?? "empty"} → ${data.label_name ?? `instruction ${data.target_tac_id}`}`,
        });
        break;
      }
      case "ICG_ENTER_FUNCTION":
      case "ICG_EXIT_FUNCTION": {
        const data = step.data as ICGFunctionData;
        state.activeNodeId = originNodeId(data);
        state.activeBackpatchInstructionNo = null;
        state.activeBackpatchLabel = null;
        state.activity.push({
          stepIndex,
          tone: "info",
          message:
            step.type === "ICG_ENTER_FUNCTION"
              ? `Enter function ${data.function_name}`
              : `Exit function ${data.function_name}`,
        });
        break;
      }
      case "ICG_COMPLETE": {
        const data = step.data as ICGCompleteData;
        state.complete = data;
        state.activeBackpatchInstructionNo = null;
        state.activeBackpatchLabel = null;
        state.activity.push({
          stepIndex,
          tone: "success",
          message: "Intermediate code generation complete",
          detail: `${data.instruction_count} instructions, ${data.temporary_count} temporaries, ${data.label_count} labels`,
        });
        break;
      }
      default:
        break;
    }
  });

  return state;
};
