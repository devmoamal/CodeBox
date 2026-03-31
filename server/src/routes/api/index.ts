import { Hono } from "hono";
import storage from "./storage";
import projects from "./projects";

const router = new Hono();

router.route("/projects", projects);
router.route("/storage", storage);

export default router;
