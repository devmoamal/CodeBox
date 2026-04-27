import { Hono } from "hono";

import { AuthVariables } from "@/middlewares/auth.middleware";
import { SystemService } from "@/services/system.service";
import Response from "@/lib/response";

const router = new Hono<{ Variables: AuthVariables }>();

router.get("/stats", async (c) => {
  const stats = await SystemService.getStats();
  return Response.success(c, stats);
});

export default router;
