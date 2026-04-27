import { Hono } from "hono";
import apiRoute from "./api";
import { AuthVariables } from "@/middlewares/auth.middleware";

const router = new Hono<{ Variables: AuthVariables }>();

router.route("/api", apiRoute);

export default router;
