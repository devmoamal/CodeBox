import { Hono } from "hono";
import storage from "./storage";
import projects from "./projects";
import runner from "./runner";
import terminal from "./terminal";
import system from "./system";
import auth from "./auth";

import { AuthVariables, authMiddleware } from "@/middlewares/auth.middleware";

const router = new Hono<{ Variables: AuthVariables }>();

router.route("/auth", auth);

router.use("*", authMiddleware);

router.route("/projects", projects);
router.route("/storage", storage);
router.route("/runner", runner);
router.route("/terminal", terminal);
router.route("/system", system);

export default router;
