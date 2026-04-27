import api from "@/lib/api";

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export const RunnerService = {
  run: async (projectId: string, path: string): Promise<RunResult> => {
    return api.post<RunResult>(`/runner/${projectId}/run`, null, {
      params: { path },
    });
  },
};
