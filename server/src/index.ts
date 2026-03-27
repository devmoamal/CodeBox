import { app } from "@/app";
import { env } from "@/config/env.config";
import { logger } from "@/lib/logger";

export default {
  port: env.PORT,
  fetch: app.fetch,
};

logger.info(`Server running on port ${env.PORT}`);
