import z from "zod";

const baseProjectSchema = z.object({
  id: z.uuid("The id must be an uuid"),
  name: z.string().min(1, "Project name is required"),
  created_at: z.date(),
  updated_at: z.date(),
});

export const projectIdParamSchema = z.object({
  project_id: baseProjectSchema.shape.id,
});

export const createProjectBodySchema = baseProjectSchema.pick({
  name: true,
});

export const updateProjectBodySchema = baseProjectSchema.pick({
  name: true,
});
