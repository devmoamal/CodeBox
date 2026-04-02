import { Storage } from "@/lib/storage";
import { logger } from "@/lib/logger";

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class RunnerService {
  /**
   * Executes a Python file within a project.
   */
  static async execute(
    projectId: string,
    filePath: string,
  ): Promise<RunResult> {
    const fullPath = Storage.resolveProjectPath(projectId, filePath);

    logger.info(`Executing python script: ${fullPath}`);

    const proc = Bun.spawn(["python3", fullPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return {
      stdout,
      stderr,
      exitCode,
    };
  }
}
