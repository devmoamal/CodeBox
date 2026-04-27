import { upgradeWebSocket } from "@/lib/ws";
import { Hono } from "hono";
import { logger } from "@/lib/logger";
import { TerminalSession } from "@/lib/terminal";
import { Storage } from "@/lib/storage";
import { AuthVariables } from "@/middlewares/auth.middleware";

const router = new Hono<{ Variables: AuthVariables }>();

// Keep strong references to active sessions so GC doesn't collect them
const activeSessions = new Map<any, TerminalSession>();

router.get(
  "/:project_id",
  upgradeWebSocket(async (c) => {
    const projectId = c.req.param("project_id");

    if (!projectId) {
      return {
        onOpen(_event: any, ws: any) {
          ws.send("\r\n\x1b[31m[Error] Project ID is required\x1b[0m\r\n");
          ws.close();
        },
      };
    }

    // Ensure project directory exists
    try {
      if (!(await Storage.exists(projectId))) {
        await Storage.createFolder(projectId);
      }
    } catch (err) {
      logger.error(`Failed to prepare project directory: ${err}`);
      return {
        onOpen(_event: any, ws: any) {
          ws.send("\r\n\x1b[31m[Error] Failed to access project directory\x1b[0m\r\n");
          ws.close();
        },
      };
    }

    const projectDir = Storage.resolvePath(projectId);
    const shell =
      process.platform === "win32"
        ? "cmd.exe"
        : process.platform === "darwin"
          ? "/bin/zsh"
          : "/bin/bash";

    return {
      onOpen(_event: any, ws: any) {
        logger.info(`Terminal session opened for project: ${projectId}`);

        const session = new TerminalSession(shell, {
          name: "xterm-256color",
          cols: 80,
          rows: 24,
          cwd: projectDir,
          projectId,
        });

        try {
          session.start(
            // onData: forward PTY output → WebSocket
            (data) => {
              try {
                ws.send(data);
              } catch (e) {
                // Ignore send errors if socket is closed
              }
            },
            // onExit
            (_exitCode, _signal) => {
              activeSessions.delete((ws as any).raw);
              if (ws.readyState === 1) {
                ws.send("\r\n\x1b[31m[Terminal] Shell exited\x1b[0m\r\n");
                ws.close();
              }
            },
          );

          activeSessions.set((ws as any).raw, session);
        } catch (err) {
          logger.error(`Failed to start PTY: ${err}`);
          ws.send("\r\n\x1b[31m[Error] Failed to start terminal\x1b[0m\r\n");
          ws.close();
        }
      },

      onMessage(event: any, ws: any) {
        const session = activeSessions.get((ws as any).raw);
        if (!session || !session.isActive) return;

        const raw = event.data.toString();

        // Handle resize control message
        if (raw.startsWith("{") && raw.endsWith("}")) {
          try {
            const msg = JSON.parse(raw);
            if (
              msg.type === "resize" &&
              typeof msg.cols === "number" &&
              typeof msg.rows === "number"
            ) {
              session.resize(msg.cols, msg.rows);
              return;
            }
          } catch {
            // Not JSON — send as raw input to PTY
          }
        }

        // Forward raw input directly to PTY (handles echo, arrow keys, etc.)
        session.write(raw);
      },

      onClose(_event: any, ws: any) {
        logger.info(`Terminal session closed for project: ${projectId}`);
        const session = activeSessions.get((ws as any).raw);
        if (session) {
          session.kill();
          activeSessions.delete((ws as any).raw);
        }
      },
    };
  }),
);

export default router;
