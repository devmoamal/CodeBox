import { Hono } from "hono";
import apiRoute from "./api";

const router = new Hono();

router.route("/api", apiRoute);

export default router;
