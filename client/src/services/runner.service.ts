import { apiClient } from "@/lib/api";
import { SuccessResponse } from "@codebox/shared";

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export const RunnerService = {
  run: async (projectId: string, path: string): Promise<RunResult> => {
    const response = await apiClient.post<unknown, SuccessResponse<RunResult>>(`/runner/${projectId}/run`, null, {
      params: { path },
    });
    if (!response.data) throw new Error("Execution failed with no result");
    return response.data;
  },
};
