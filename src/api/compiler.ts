import type { StepsData } from "../types/steps";

export interface CompileResponse {
  stepsData: StepsData;
  astData: unknown;
  stdout: string;
  stderr: string;
}

export const compileSource = async (sourceCode: string): Promise<CompileResponse> => {
  const response = await fetch("/api/compile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sourceCode }),
  });

  const payload = (await response.json()) as Partial<CompileResponse> & {
    error?: string;
    details?: string;
  };

  if (!response.ok) {
    const errorMessage = [payload.error, payload.details].filter(Boolean).join(" ");
    throw new Error(errorMessage || "Compilation failed.");
  }

  if (!payload.stepsData || !payload.astData) {
    throw new Error("Backend response is missing stepsData or astData.");
  }

  return {
    stepsData: payload.stepsData,
    astData: payload.astData,
    stdout: payload.stdout ?? "",
    stderr: payload.stderr ?? "",
  };
};
