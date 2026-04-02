import { logger } from "./logger";
import { existsSync } from "fs";
import { resolve, join } from "path";
import { Storage } from "./storage";

export interface TerminalOptions {
  cwd: string;
  projectId?: string;
  name?: string;
  env?: { [key: string]: string | undefined };
  cols?: number;
  rows?: number;
}

const PROMPT_STYLE = "#codebox $ ";
const HIDE_PROMPT = `PROMPT=""; PS1=""; stty -echo`;
const SHOW_PROMPT = `\r\x1b[KPROMPT='${PROMPT_STYLE}'; PS1='${PROMPT_STYLE}'; stty echo`;

export class TerminalSession {
  private proc: any = null; // Bun.Subprocess
  private isKilled = false;
  private wrapperPath = resolve(join(import.meta.dir, "pty-wrapper.cjs"));
  private onDataCallback?: (data: string) => void;
  private onStatusCallback?: (status: "running" | "idle") => void;

  private isInitializing = true;
  private isRunnerActive = false;

  private isSuppressingNextEcho = false;
  private suppressionBuffer = "";

  constructor(
    private shell: string,
    private options: TerminalOptions,
  ) {}

  public start(
    onData: (data: string) => void,
    onExit: (exitCode: number, signal?: number) => void,
    onStatus?: (status: "running" | "idle") => void,
  ) {
    this.onDataCallback = onData;
    this.onStatusCallback = onStatus;

    if (!existsSync(this.options.cwd)) {
      logger.warn(
        `Terminal CWD does not exist, falling back to process.cwd(): ${this.options.cwd}`,
      );
      this.options.cwd = process.cwd();
    }

    const absoluteCwd = resolve(this.options.cwd);

    try {
      logger.info(`Spawning Node.js PTY offloader at: ${this.wrapperPath}`);

      this.proc = Bun.spawn(
        [
          "node",
          this.wrapperPath,
          this.shell || (process.platform === "darwin" ? "zsh" : "bash"),
          absoluteCwd,
          (this.options.cols || 80).toString(),
          (this.options.rows || 24).toString(),
        ],
        {
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
          env: (this.options.env || process.env) as any,
        },
      );

      (async () => {
        const reader = this.proc.stdout.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value);
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const msg = JSON.parse(line);
                if (msg.type === "data") {
                  if (this.isInitializing) {
                    if (msg.data.includes("@@CB_READY@@")) {
                      this.isInitializing = false;
                      const cleanData = msg.data.split("@@CB_READY@@")[1] || "";
                      if (!cleanData.trim()) continue;
                      onData(cleanData);
                    }
                    continue;
                  }

                  let currentData = msg.data;

                  // STATUS INTERCEPTION (From shell runner execution)
                  if (currentData.includes("@@CB_STATUS@@:running")) {
                    currentData = currentData.replace(/@@CB_STATUS@@:running\r?\n?/g, "");
                    this.isRunnerActive = true;
                    this.onStatusCallback?.("running");
                  }
                  
                  if (currentData.includes("@@CB_STATUS@@:idle")) {
                    currentData = currentData.replace(/@@CB_STATUS@@:idle\r?\n?/g, "");
                    this.isRunnerActive = false;
                    this.onStatusCallback?.("idle");
                  }

                  // COMMAND EXEC INTERCEPTION (For move, rename, delete, help)
                  if (currentData.includes("@@CB_EXEC@@:")) {
                    const match = currentData.match(/@@CB_EXEC@@:(\w+)(?:\s+(.*))?/);
                    if (match) {
                      const [, cmd, args] = match;
                      this.handleMarkerCommand(cmd, (args || "").trim());
                      currentData = currentData.replace(/@@CB_EXEC@@:.*?\r?\n?/g, "");
                    }
                  }

                  // ECHO SUPPRESSION (For backend-driven UI commands)
                  if (this.isSuppressingNextEcho) {
                    this.suppressionBuffer += currentData;
                    if (this.suppressionBuffer.includes(SHOW_PROMPT)) {
                      const parts = this.suppressionBuffer.split(SHOW_PROMPT);
                      const after = parts[parts.length - 1];
                      currentData = after.startsWith("\n") ? after.substring(1) : after;
                      this.isSuppressingNextEcho = false;
                      this.suppressionBuffer = "";
                    } else {
                      continue; // Still buffering the command
                    }
                  }

                   // Drop if it was entirely a suppressed marker
                  if (!currentData.trim() && msg.data.trim()) {
                    continue;
                  }

                  if (currentData) {
                    onData(currentData);
                  }
                } else if (msg.type === "exit") {
                  this.cleanup();
                  onExit(msg.exitCode, msg.signal);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        } catch (error) {
          if (!this.isKilled) {
            logger.error("Error reading PTY wrapper output", error);
          }
        }
      })();

      (async () => {
        const reader = this.proc.stderr.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          logger.warn(`PTY Wrapper stderr: ${decoder.decode(value)}`);
        }
      })();

      logger.info(
        `Terminal process started via Node.js offloader (Bun PID: ${this.proc.pid})`,
      );

      // Phased silent initialization to prevent output leaks
      setTimeout(() => {
        const functions = [
          `export PROMPT='${PROMPT_STYLE}'`,
          `export PS1='${PROMPT_STYLE}'`,
          `run() {`,
          `  printf "\\n@@CB_STATUS@@:running\\n"`,
          `  PROMPT=""; PS1=""; stty echo`,
          `  python3 -u "$@"`,
          `  local exit_code=$?`,
          `  stty -echo`,
          `  if [ $exit_code -eq 130 ]; then`,
          `    printf "\\r\\n\\033[2K\\033[31m[CodeBox] Execution stopped\\033[0m\\r\\n"`,
          `  elif [ $exit_code -ne 0 ]; then`,
          `    printf "\\r\\n\\033[31m[CodeBox] Execution failed (exit code %d)\\033[0m\\r\\n" "$exit_code"`,
          `  else`,
          `    printf "\\r\\n\\033[2m[CodeBox] Execution finished successfully\\033[0m\\r\\n"`,
          `  fi`,
          `  printf "@@CB_STATUS@@:idle\\n"`,
          `  PROMPT='${PROMPT_STYLE}'; PS1='${PROMPT_STYLE}'; stty echo; echo ""`,
          `}`,
          `stop() { echo "No script is currently running."; }`,
          `move() { ${HIDE_PROMPT}; printf "\\n@@CB_EXEC@@:move %s\\n" "$*"; }`,
          `rename() { ${HIDE_PROMPT}; printf "\\n@@CB_EXEC@@:rename %s\\n" "$*"; }`,
          `delete() { ${HIDE_PROMPT}; printf "\\n@@CB_EXEC@@:delete %s\\n" "$*"; }`,
          `help() { ${HIDE_PROMPT}; printf "\\n@@CB_EXEC@@:help\\n"; }`,
        ].join("\n") + "\n";
        
        this.rawWrite(functions);

        setTimeout(() => {
          this.rawWrite(`echo "@@CB_READY@@"\n`);
        }, 300);
      }, 500);
    } catch (error: any) {
      logger.error("Failed to start terminal offloader", error);
      throw error;
    }

    return this.proc;
  }

  public async write(data: string) {
    if (!this.proc || this.isKilled) return;

    // INTERCEPTION: Cleanly route Stop UI command to interactive scripts
    if (this.isRunnerActive && (data.trim() === "stop" || data === "\x03")) {
      this.rawWrite("\x03"); // Send SIGINT to the PTY
      return;
    }

    this.rawWrite(data);
  }

  private rawWrite(data: string) {
    try {
      const msg = JSON.stringify({ type: "write", data }) + "\n";
      this.proc.stdin.write(msg);
      this.proc.stdin.flush();
    } catch (error) {
      logger.error("Failed to write to PTY offloader", error);
    }
  }

  private handleMarkerCommand(cmd: string, args: string) {
    switch (cmd.toLowerCase()) {
      case "move": {
        const parts = args.split(/\s+/);
        if (parts.length >= 2) this.executeMove(parts[0], parts[1]);
        break;
      }
      case "rename": {
        const parts = args.split(/\s+/);
        if (parts.length >= 2) this.executeMove(parts[0], parts[1], "Rename");
        break;
      }
      case "delete":
        if (args) this.executeDelete(args);
        break;
      case "help":
        this.showHelp();
        break;
    }
  }

  private sendToTerminal(data: string) {
    if (this.onDataCallback) {
      this.onDataCallback(data.replace(/\n/g, "\r\n"));
    }
  }

  private finalizeCommand() {
    this.isSuppressingNextEcho = true;
    this.suppressionBuffer = "";
    this.rawWrite(`\n${SHOW_PROMPT}\n`);
    this.onStatusCallback?.("idle");
  }

  private async executeMove(oldPath: string, newPath: string, action = "Move") {
    try {
      const src = this.options.projectId
        ? join(this.options.projectId, oldPath)
        : oldPath;
      const dest = this.options.projectId
        ? join(this.options.projectId, newPath)
        : newPath;

      await Storage.changeFileDir(src, dest);
      this.sendToTerminal(
        `\r\n\x1b[2m[CodeBox] ${action} successful: ${oldPath} -> ${newPath}\x1b[0m\r\n`,
      );
      this.finalizeCommand();
    } catch (e: any) {
      this.sendToTerminal(
        `\r\n\x1b[31m[CodeBox] ${action} failed: ${e.message}\x1b[0m\r\n`,
      );
      this.finalizeCommand();
    }
  }

  private async executeDelete(path: string) {
    try {
      const fullPath = this.options.projectId
        ? join(this.options.projectId, path)
        : path;
      await Storage.delete(fullPath);
      this.sendToTerminal(`\r\n\x1b[2m[CodeBox] Deleted ${path}\x1b[0m\r\n`);
      this.finalizeCommand();
    } catch (e: any) {
      this.sendToTerminal(
        `\r\n\x1b[31m[CodeBox] Delete failed: ${e.message}\x1b[0m\r\n`,
      );
      this.finalizeCommand();
    }
  }

  private showHelp() {
    const help = `\r\n\x1b[1m\x1b[36mCodeBox Custom Commands:\x1b[0m
  \x1b[33mrun <file.py>\x1b[0m           Execute a Python script
  \x1b[33mmove <old> <new>\x1b[0m        Move or rename a file/folder
  \x1b[33mrename <old> <new>\x1b[0m      Rename a file/folder
  \x1b[33mdelete <path>\x1b[0m           Delete a file or folder
  \x1b[33mhelp\x1b[0m                    Show this help menu\r\n`;
    
    this.sendToTerminal(help);
    this.sendToTerminal(`\x1b[2m[CodeBox] Help menu displayed\x1b[0m\r\n`);
    this.finalizeCommand();
  }

  public resize(cols: number, rows: number) {
    if (!this.proc || this.isKilled) return;

    try {
      const msg = JSON.stringify({ type: "resize", cols, rows }) + "\n";
      this.proc.stdin.write(msg);
      this.proc.stdin.flush();
    } catch (error) {
      logger.error("Failed to resize PTY offloader", error);
    }
  }

  private cleanup() {
    this.isKilled = true;
    this.proc = null;
  }

  public kill() {
    if (this.isKilled) return;
    this.cleanup();
    if (this.proc) {
      try {
        const msg = JSON.stringify({ type: "kill" }) + "\n";
        this.proc.stdin.write(msg);
        this.proc.stdin.flush();
        this.proc.kill();
      } catch (error) {
        // Ignore kill errors
      }
    }
  }

  public get isActive() {
    return this.proc !== null && !this.isKilled;
  }
}
