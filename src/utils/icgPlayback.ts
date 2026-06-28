import type {
  ICGCompleteData,
  ICGCreateLabelData,
  ICGCreateTempData,
  ICGEmitData,
  ICGFunctionData,
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

export const deriveICGPlaybackState = (
  steps: Step[],
  currentStepIndex: number
): ICGPlaybackState => {
  const state: ICGPlaybackState = {
    instructions: [],
    activity: [],
    activeInstructionNo: null,
    activeNodeId: null,
    complete: null,
  };

  const upperBound = Math.min(currentStepIndex, steps.length - 1);
  if (upperBound < 0) return state;

  const instructionByNo = new Map<number, TACInstructionView>();

  steps.slice(0, upperBound + 1).forEach((step, stepIndex) => {
    switch (step.type) {
      case "ICG_NODE_VISIT": {
        const data = step.data as ICGNodeVisitData;
        state.activeNodeId = originNodeId(data);
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
        }
        state.activity.push({
          stepIndex,
          tone: "create",
          message: `Patch jump with ${data.label_name}`,
          detail: data.text,
        });
        break;
      }
      case "ICG_ENTER_FUNCTION":
      case "ICG_EXIT_FUNCTION": {
        const data = step.data as ICGFunctionData;
        state.activeNodeId = originNodeId(data);
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
