import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middlewares/validate.middleware";
import { Hono } from "hono";
import {
  FileBodySchema,
  FileQuerySchema,
  FileRenameSchema,
  projectIdParamSchema,
} from "@codebox/shared";
import { StorageService } from "@/services/storage.service";
import { BadRequestError, NotFoundError } from "@/lib/error";
import Response from "@/lib/response";

const router = new Hono();

/**
 * List files for a project or get a specific file's content.
 */
router.get(
  "/:project_id",
  validateParams(projectIdParamSchema),
  validateQuery(FileQuerySchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const { path } = c.req.valid("query");

    if (path && path !== ".") {
      const content = await StorageService.readContent(project_id, path);
      return Response.success(c, { content });
    }

    // List all files belonging to the project
    const all = await StorageService.listAllByProjectId(project_id);
    return Response.success(c, all);
  },
);

/**
 * Create a new file within a project.
 */
router.post(
  "/:project_id",
  validateParams(projectIdParamSchema),
  validateBody(FileBodySchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const { path, content, is_folder } = c.req.valid("json");

    const record = await StorageService.create(
      project_id,
      path,
      content,
      is_folder,
    );
    return Response.success(c, record, "Resource created successfully", 201);
  },
);

/**
 * Upload an external file to a project (Multipart).
 */
router.post(
  "/:project_id/upload",
  validateParams(projectIdParamSchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const body = await c.req.parseBody();
    const file = body.file as File | Blob;
    const path = body.path as string;

    if (!file || !path) {
      throw new BadRequestError("File and path are required");
    }

    const record = await StorageService.create(
      project_id,
      path,
      file,
      false
    );
    return Response.success(c, record, "File uploaded successfully", 201);
  },
);

/**
 * Update the content of a file within a project.
 */
router.put(
  "/:project_id",
  validateParams(projectIdParamSchema),
  validateBody(FileBodySchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const { path, content } = c.req.valid("json");

    if (content === undefined) {
      throw new BadRequestError("Content is required for updates");
    }

    const updated = await StorageService.updateContent(project_id, path, content);
    return Response.success(c, updated, "Content updated successfully");
  },
);

/**
 * Rename a file or folder within a project.
 */
router.put(
  "/:project_id/rename",
  validateParams(projectIdParamSchema),
  validateBody(FileRenameSchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const { old_path, new_path } = c.req.valid("json");

    const updated = await StorageService.move(project_id, old_path, new_path);
    return Response.success(c, updated, "Resource renamed successfully");
  },
);

/**
 * Delete a file within a project.
 */
router.delete(
  "/:project_id",
  validateParams(projectIdParamSchema),
  validateBody(FileQuerySchema),
  async (c) => {
    const { project_id } = c.req.valid("param");
    const { path } = c.req.valid("json");

    if (!path) throw new Error("Path is required for deletion");

    await StorageService.delete(project_id, path);
    return Response.success(c, null, "Resource deleted successfully");
  },
);

export default router;
