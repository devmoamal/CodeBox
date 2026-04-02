import { Hono } from "hono";
import { validateParams, validateQuery } from "@/middlewares/validate.middleware";
import { projectIdParamSchema, FileQuerySchema, API_ERROR_CODE } from "@codebox/shared";
import { RunnerService } from "@/services/runner.service";
import Response from "@/lib/response";
import { logger } from "@/lib/logger";

const router = new Hono();

/**
 * Execute a python file in a project
 */
router.post(
  "/:project_id/run",
  validateParams(projectIdParamSchema),
  validateQuery(FileQuerySchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const { path } = c.req.valid("query");

    if (!path) {
      return Response.error(c, API_ERROR_CODE.BAD_REQUEST, "File path is required", 400);
    }

    try {
      logger.info(`Run requested for ${path} in ${project_id}`);
      const result = await RunnerService.execute(project_id, path);
      return Response.success(c, result, "Code executed successfully");
    } catch (error: any) {
      logger.error(`Execution failed: ${error.message}`);
      return Response.error(c, API_ERROR_CODE.SERVER_ERROR, `Execution failed: ${error.message}`, 500);
    }
  }
);

export default router;
