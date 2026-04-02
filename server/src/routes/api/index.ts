import { Hono } from "hono";
import storage from "./storage";
import projects from "./projects";
import runner from "./runner";
import terminal from "./terminal";

const router = new Hono();

router.route("/projects", projects);
router.route("/storage", storage);
router.route("/runner", runner);
router.route("/terminal", terminal);

export default router;
