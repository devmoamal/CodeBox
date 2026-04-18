import { app } from "@/app";
import { env } from "@/config/env.config";
import { logger } from "@/lib/logger";
import { websocket } from "@/lib/ws";

export default {
  port: env.PORT,
  fetch: app.fetch,
  websocket,
};

logger.info(`Server running on port ${env.PORT}`);
