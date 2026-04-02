import z from "zod";

export const FileQuerySchema = z.object({
  path: z.string().optional().default("."),
});

export const FileBodySchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  is_folder: z.boolean().optional().default(false),
});

export const FileRenameSchema = z.object({
  old_path: z.string(),
  new_path: z.string(),
});
