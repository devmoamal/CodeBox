import { Context, Next } from "hono";
import { logger } from "@/lib/logger";

export const loggerMiddleware = async (c: Context, next: Next) => {
  const { method, path } = c.req;
  await next();
  const status = c.res.status;
  logger.info(`[${method}] ${path} [${status}]`);
};
