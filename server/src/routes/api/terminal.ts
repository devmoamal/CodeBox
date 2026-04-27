import { upgradeWebSocket } from "@/lib/ws";
import { Hono } from "hono";
import { logger } from "@/lib/logger";
import { TerminalSession } from "@/lib/terminal";
import { Storage } from "@/lib/storage";
import { AuthVariables } from "@/middlewares/auth.middleware";

const router = new Hono<{ Variables: AuthVariables }>();

// Global map to keep a strong reference to active terminal sessions
const activeSessions = new Map<any, TerminalSession>();

router.get(
  "/:project_id",
  upgradeWebSocket(async (c) => {
    const projectId = c.req.param("project_id");
    if (!projectId) {
      logger.error("Terminal upgrade failed: Project ID is missing");
      return {
        onOpen(_event, ws) {
          ws.send("\r\n\x1b[31m[Error] Project ID is required\x1b[0m\r\n");
          ws.close();
        },
      };
    }

    try {
      const projectDir = Storage.resolvePath(projectId);
      logger.info(`Terminal request for project: ${projectId} at ${projectDir}`);

      // Ensure directory exists
      if (!(await Storage.exists(projectId))) {
        logger.info(`Creating project directory for: ${projectId}`);
        await Storage.createFolder(projectId);
      }

      // Final check to confirm directory is available
      if (!(await Storage.exists(projectId))) {
        logger.error(`Failed to access project directory: ${projectDir}`);
        return {
          onOpen(_event, ws) {
            ws.send(`\r\n\x1b[31m[Error] Failed to access project directory: ${projectId}\x1b[0m\r\n`);
            ws.close();
          },
        };
      }

      const shell =
        process.platform === "win32"
          ? "cmd.exe"
          : process.platform === "darwin"
            ? "/bin/zsh"
            : "/bin/bash";

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

          try {
            session.start(
              (data) => {
                if (ws.readyState === 1) ws.send(data);
              },
              (exitCode, signal) => {
                logger.info(`PTY exited with code ${exitCode} (signal ${signal})`);
                activeSessions.delete(ws);
                if (ws.readyState === 1) ws.close();
              },
              (status) => {
                if (ws.readyState === 1) ws.send(`__CB_STATUS__:${status}`);
              },
              () => {
                if (ws.readyState === 1) ws.send(`__CB_FS_CHANGED__`);
              }
            );

            activeSessions.set(ws, session);
          } catch (err) {
            logger.error(`Failed to start terminal session: ${err}`);
            ws.send("\r\n\x1b[31m[Error] Failed to start terminal session\x1b[0m\r\n");
            ws.close();
          }
        },
        onMessage(event, ws) {
          const session = activeSessions.get(ws);
          if (!session || !session.isActive) return;

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
    } catch (error) {
      logger.error(`Error during terminal upgrade for ${projectId}:`, error);
      return {
        onOpen(_event, ws) {
          ws.send("\r\n\x1b[31m[Error] Internal Server Error during terminal connection\x1b[0m\r\n");
          ws.close();
        },
      };
    }
  }),
);

// Fallback handler for non-WebSocket GET requests to avoid 404s
router.get("/:project_id", (c) => {
  return c.json({ status: "ok", message: "Terminal WebSocket endpoint" });
});

export default router;
