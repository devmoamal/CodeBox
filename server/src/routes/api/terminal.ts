import { createBunWebSocket } from "hono/bun";
import { Hono } from "hono";
import { logger } from "@/lib/logger";
import { TerminalSession } from "@/lib/terminal";
import { Storage } from "@/lib/storage";

export const { upgradeWebSocket, websocket } = createBunWebSocket();

const router = new Hono();

// Global map to keep a strong reference to active terminal sessions
const activeSessions = new Map<any, TerminalSession>();

router.get(
  "/:project_id",
  upgradeWebSocket(async (c) => {
    const projectId = c.req.param("project_id");
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    const projectDir = Storage.resolvePath(projectId);

    // Ensure directory exists
    if (!(await Storage.exists(projectId))) {
      logger.info(`Creating project directory for: ${projectId}`);
      await Storage.createFolder(projectId);
    }

    // Final check to confirm directory is available
    if (!(await Storage.exists(projectId))) {
      logger.error(`Failed to create/access project directory: ${projectDir}`);
    } else {
      logger.info(`Project directory confirmed: ${projectDir}`);
    }

    const shell =
      process.platform === "win32"
        ? "cmd.exe"
        : process.platform === "darwin"
          ? "/bin/zsh"
          : "/bin/bash";
    const shortId = projectId.substring(0, 8);
    const session = new TerminalSession(shell, {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      cwd: projectDir,
      projectId: projectId,
    });

    return {
      onOpen(_event, ws) {
        logger.info(`Terminal session opened for project: ${projectId}`);

        session.start(
          (data) => ws.send(data),
          (exitCode, signal) => {
            logger.info(`PTY exited with code ${exitCode} (signal ${signal})`);
            activeSessions.delete(ws);
            if (ws.readyState === 1) {
              // 1 is OPEN
              ws.close();
            }
          },
          (status) => {
            if (ws.readyState === 1) {
              ws.send(`__CB_STATUS__:${status}`);
            }
          }
        );

        activeSessions.set(ws, session);
      },
      onMessage(event, ws) {
        if (!session.isActive) return;

        const rawData = event.data.toString();

        try {
          // Check if it's a JSON command (resize)
          if (rawData.startsWith("{") && rawData.endsWith("}")) {
            try {
              const msg = JSON.parse(rawData);
              if (
                msg.type === "resize" &&
                typeof msg.cols === "number" &&
                typeof msg.rows === "number"
              ) {
                session.resize(msg.cols, msg.rows);
                return;
              }
            } catch (e) {
              // Not valid JSON or not a resize command, treat as raw data
            }
          }

          session.write(rawData);
        } catch (error) {
          logger.error("Error in terminal onMessage handler", error);
        }
      },
      onClose(event, ws) {
        logger.info(`Terminal session closed for project: ${projectId}`);
        const session = activeSessions.get(ws);
        if (session) {
          session.kill();
          activeSessions.delete(ws);
        }
      },
    };
  }),
);

// Fallback handler for non-WebSocket GET requests to avoid 404s
router.get("/:project_id", (c) => {
  return c.json({ status: "ok", message: "Terminal WebSocket endpoint" });
});

export default router;
