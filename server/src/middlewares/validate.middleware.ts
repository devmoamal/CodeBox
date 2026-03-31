import { ValidationError } from "@/lib/error";
import { validator } from "hono/validator";
import z from "zod";

export const validateBody = <T extends z.ZodTypeAny>(schema: T) =>
  validator("json", (value) => {
    const result = schema.safeParse(value);
    if (!result.success)
      throw new ValidationError(result.error.issues[0].message);
    return result.data as z.infer<T>;
  });

export const validateParams = <T extends z.ZodTypeAny>(schema: T) =>
  validator("param", (value) => {
    const result = schema.safeParse(value);
    if (!result.success)
      throw new ValidationError(result.error.issues[0].message);
    return result.data as z.infer<T>;
  });

export const validateQuery = <T extends z.ZodTypeAny>(schema: T) =>
  validator("query", (value) => {
    const result = schema.safeParse(value);
    if (!result.success)
      throw new ValidationError(result.error.issues[0].message);
    return result.data as z.infer<T>;
  });

export const validateFormData = <T extends z.ZodTypeAny>(schema: T) =>
  validator("form", (value) => {
    const result = schema.safeParse(value);
    if (!result.success)
      throw new ValidationError(result.error.issues[0].message);
    return result.data as z.infer<T>;
  });
