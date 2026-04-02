import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middlewares/validate.middleware";
import {
  createProjectBodySchema,
  projectIdParamSchema,
  updateProjectBodySchema,
  paginationQuerySchema,
} from "@codebox/shared";
import { Hono } from "hono";
import { ProjectsService } from "@/services/projects.service";
import { StorageService } from "@/services/storage.service";
import { NotFoundError } from "@/lib/error";
import Response from "@/lib/response";

const router = new Hono();

/**
 * List all projects
 */
router.get("/", validateQuery(paginationQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const projects = await ProjectsService.listAll(query);
  return Response.success(c, projects);
});

/**
 * Get a single project
 */
router.get("/:project_id", validateParams(projectIdParamSchema), async (c) => {
  const { project_id } = c.req.valid("param");
  const project = await ProjectsService.findById(project_id);
  if (!project) throw new NotFoundError("Project not found");
  return Response.success(c, project);
});

/**
 * List all files in a project
 */
router.get("/:project_id/files", validateParams(projectIdParamSchema), async (c) => {
  const { project_id } = c.req.valid("param");
  const project = await ProjectsService.findById(project_id);
  if (!project) throw new NotFoundError("Project not found");

  const files = await StorageService.listAllByProjectId(project_id);
  return Response.success(c, files);
});

/**
 * Create a new project
 */
router.post("/", validateBody(createProjectBodySchema), async (c) => {
  const data = c.req.valid("json");
  const project = await ProjectsService.create(data);
  return Response.success(c, project, "Project created successfully", 201);
});

/**
 * Update a project
 */
router.put(
  "/:project_id",
  validateParams(projectIdParamSchema),
  validateBody(updateProjectBodySchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const data = c.req.valid("json");

    const project = await ProjectsService.update(project_id, data);
    if (!project) throw new NotFoundError("Project not found");

    return Response.success(c, project, "Project updated successfully");
  },
);

/**
 * Delete a project
 */
router.delete("/:project_id", validateParams(projectIdParamSchema), async (c) => {
  const { project_id } = c.req.valid("param");
  
  // Cleanup project records and files
  await StorageService.deleteAll(project_id);
  const deleted = await ProjectsService.delete(project_id);
  
  if (!deleted) throw new NotFoundError("Project not found");

  return Response.success(c, null, "Project deleted successfully");
});

export default router;
