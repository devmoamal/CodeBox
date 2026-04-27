import { Hono } from "hono";
import { AuthService } from "@/services/auth.service";
import { validateBody } from "@/middlewares/validate.middleware";
import { AuthVariables, authMiddleware } from "@/middlewares/auth.middleware";
import { loginSchema } from "@codebox/shared";

const auth = new Hono<{ Variables: AuthVariables }>();

auth.post("/login", validateBody(loginSchema), async (c) => {
  const data = c.req.valid("json");
  try {
    const result = await AuthService.authenticate(data);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

export default auth;
