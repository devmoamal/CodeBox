import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { env } from "@/config/env.config";

export type AuthVariables = {
  user: {
    id: string;
    username: string;
  };
};

export const authMiddleware = async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
  let token = "";
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    // Check query parameter for WebSocket connections or as fallback
    token = c.req.query("token") || "";
  }

  if (!token) {
    return c.json({ error: "Unauthorized: Missing token" }, 401);
  }

  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    c.set("user", {
      id: payload.id as string,
      username: payload.username as string,
    });
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
};
