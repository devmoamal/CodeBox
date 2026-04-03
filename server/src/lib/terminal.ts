import { logger } from "./logger";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { resolve, join, relative } from "path";
import { Storage } from "./storage";
import type { Subprocess } from "bun";

export interface TerminalOptions {
  cwd: string;
  projectId?: string;
  name?: string;
  env?: { [key: string]: string | undefined };
  cols?: number;
  rows?: number;
}

export class TerminalSession {
  private cwd: string;
  private commandBuffer: string = "";
  private procCommandBuffer: string = "";
  private onDataCallback?: (data: string) => void;
  private onStatusCallback?: (status: "running" | "idle") => void;
  private activeProc: Subprocess<"pipe", "pipe", "pipe"> | null = null;
  private history: string[] = [];
  private historyIndex: number = -1;
  private savedCommand: string = "";

  constructor(private shell: string, private options: TerminalOptions) {
    this.cwd = options.cwd;
  }

  private get promptString() {
    const projectRoot = resolve(this.options.cwd);
    let rel = relative(projectRoot, this.cwd);
    if (!rel || rel === "") {
        return `\x1b[32m#codebox ~\x1b[0m $ `;
    }
    return `\x1b[32m#codebox ~/${rel}\x1b[0m $ `;
  }

  public start(
    onData: (data: string) => void,
    _onExit: (exitCode: number, signal?: number) => void,
    onStatus?: (status: "running" | "idle") => void
  ) {
    this.onDataCallback = onData;
    this.onStatusCallback = onStatus;

    this.writePrompt();
    return { pid: process.pid }; // Placeholder for compatibility
  }

  private writePrompt(newline = false) {
    const p = newline ? "\r\n" + this.promptString : this.promptString;
    this.send(p);
  }

  private send(data: string) {
    this.onDataCallback?.(data);
  }

  private resolveSecurePath(target: string): string | null {
    const projectRoot = resolve(this.options.cwd);
    const resolved = resolve(this.cwd, target);
    if (!resolved.startsWith(projectRoot)) {
        return null;
    }
    return resolved;
  }

  public async write(data: string) {
    if (this.activeProc) {
        this.handleProcessInput(data);
        return;
    }

    // Handle History navigation
    if (data === "\x1b[A") { // UP
        this.navigateHistory(-1);
        return;
    }
    if (data === "\x1b[B") { // DOWN
        this.navigateHistory(1);
        return;
    }

    // Skip other ANSI escape sequences from the frontend (like left/right arrow keys)
    if (data.startsWith("\x1b")) {
        return;
    }

    await this.handleLocalShellInput(data);
  }

  private navigateHistory(direction: number) {
    if (this.history.length === 0) return;

    if (this.historyIndex === -1) {
        if (direction === 1) return; // already at newest
        this.savedCommand = this.commandBuffer; // save in-progress typing
        this.historyIndex = this.history.length - 1;
    } else {
        this.historyIndex += direction;
    }

    if (this.historyIndex >= this.history.length) {
        this.historyIndex = -1;
        this.commandBuffer = this.savedCommand;
    } else if (this.historyIndex < 0) {
        this.historyIndex = 0;
        this.commandBuffer = this.history[0];
    } else {
        this.commandBuffer = this.history[this.historyIndex];
    }

    // \x1b[2K clears the entire line. \r returns carriage to start.
    this.send("\x1b[2K\r" + this.promptString + this.commandBuffer);
  }

  private handleProcessInput(data: string) {
    if (!this.activeProc) return;

    if (data === "\x03") { // Ctrl-C
        this.activeProc.kill();
        this.procCommandBuffer = "";
        return;
    }
    
    for (let i = 0; i < data.length; i++) {
        const char = data[i];
        if (char === "\r") {
            this.send("\r\n");
            try {
                this.activeProc.stdin.write(this.procCommandBuffer + "\n");
                this.activeProc.stdin.flush();
            } catch (e) { /* ignore */ }
            this.procCommandBuffer = "";
        } else if (char === "\x7f") { // Backspace
            if (this.procCommandBuffer.length > 0) {
                this.procCommandBuffer = this.procCommandBuffer.slice(0, -1);
                this.send("\b \b");
            }
        } else if (char.length === 1 && char.charCodeAt(0) >= 32) {
            this.procCommandBuffer += char;
            this.send(char);
        }
    }
  }

  private handleTabCompletion() {
    if (this.commandBuffer.length === 0) return;
    
    // Extract the last typed distinct word.
    const lastSpace = this.commandBuffer.lastIndexOf(" ");
    const fragment = lastSpace === -1 ? this.commandBuffer : this.commandBuffer.slice(lastSpace + 1);
    
    if (fragment.length === 0) return; // Don't autocomplete nothing

    try {
        const files = readdirSync(this.cwd);
        const matches = files.filter(f => f.startsWith(fragment));

        if (matches.length === 1) {
            const completion = matches[0].slice(fragment.length);
            this.commandBuffer += completion;
            this.send(completion);
        } else if (matches.length > 1) {
            let i = fragment.length;
            let commonPrefix = "";
            while (true) {
                if (i >= matches[0].length) break;
                const c = matches[0][i];
                if (matches.every(m => m[i] === c)) {
                    commonPrefix += c;
                    i++;
                } else {
                    break;
                }
            }
            
            if (commonPrefix.length > 0) {
                this.commandBuffer += commonPrefix;
                this.send(commonPrefix);
            } else {
                this.send("\r\n");
                const formatted = matches.map(f => {
                    const stats = statSync(join(this.cwd, f));
                    return stats.isDirectory() ? `\x1b[1;33m${f}/\x1b[0m` : `\x1b[34m${f}\x1b[0m`;
                }).join("  ");
                
                this.send(formatted + "\r\n");
                this.send(this.promptString + this.commandBuffer);
            }
        }
    } catch(e) {
        // ignore errors
    }
  }

  private async handleLocalShellInput(data: string) {
    for (let i = 0; i < data.length; i++) {
        const char = data[i];

        if (char === "\r") { // Enter
            this.send("\r\n");
            const cmdLine = this.commandBuffer.trim();
            
            if (cmdLine && (this.history.length === 0 || this.history[this.history.length - 1] !== cmdLine)) {
                this.history.push(cmdLine);
            }
            this.historyIndex = -1;
            this.commandBuffer = "";
            
            if (cmdLine) {
                await this.executeCommand(cmdLine);
            } else {
                this.writePrompt();
            }
        } else if (char === "\x7f") { // Backspace
            if (this.commandBuffer.length > 0) {
                this.commandBuffer = this.commandBuffer.slice(0, -1);
                this.send("\b \b");
            }
        } else if (char === "\x03") { // Ctrl-C
            this.commandBuffer = "";
            this.send("^C\r\n");
            this.writePrompt();
        } else if (char === "\t") { // Tab
            this.handleTabCompletion();
        } else if (char.length === 1 && char.charCodeAt(0) >= 32) { // Printables
            this.commandBuffer += char;
            this.send(char);
        }
    }
  }

  private async executeCommand(line: string) {
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    this.onStatusCallback?.("running");

    switch (cmd) {
      case "ls":
        this.handleLs(args);
        break;
      case "cd":
        this.handleCd(args);
        break;
      case "cat":
        this.handleCat(args);
        break;
      case "clear":
        this.send("\x1b[2J\x1b[H"); // ANSI Clear + Home
        break;
      case "help":
        this.showHelp();
        break;
      case "run":
        if (args.length > 0) {
            await this.handleRun(args[0], args.slice(1));
            return;
        } else {
            this.send("\x1b[31mUsage: run <file.py>\x1b[0m\r\n");
        }
        break;
      case "move":
      case "rename":
        if (args.length >= 2) {
            await this.executeFileSystemOp("move", args[0], args[1]);
        } else {
            this.send("\x1b[31mUsage: move <src> <dest>\x1b[0m\r\n");
        }
        break;
      case "delete":
      case "rm":
        if (args.length > 0) {
            await this.executeFileSystemOp("delete", args[0]);
        } else {
            this.send("\x1b[31mUsage: delete <path>\x1b[0m\r\n");
        }
        break;
      default:
        await this.handleExternalCommand(cmd, args);
        return;
    }

    this.onStatusCallback?.("idle");
    this.writePrompt();
  }

  private async handleExternalCommand(cmd: string, args: string[]) {
    this.onStatusCallback?.("running");
    try {
      let spawnCmd = [cmd, ...args];
      
      if (process.platform === "darwin") {
        const pyArgs = JSON.stringify([cmd, ...args]);
        const pyScript = `import pty, sys\ntry:\n    pty.spawn(${pyArgs})\nexcept FileNotFoundError:\n    sys.stdout.write("\\x1b[31mCommand not found: " + ${JSON.stringify(cmd)} + "\\x1b[0m\\r\\n")\n    sys.stdout.flush()\n    sys.exit(127)`;
        spawnCmd = ["python3", "-c", pyScript];
      }

      this.activeProc = Bun.spawn(spawnCmd, {
        cwd: this.cwd,
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdoutReader = this.activeProc.stdout.getReader();
      const stderrReader = this.activeProc.stderr.getReader();
      const decoder = new TextDecoder();

      const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, color = "") => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                const text = decoder.decode(value).replace(/\n/g, "\r\n");
                this.send(color + text + (color ? "\x1b[0m" : ""));
            }
          }
        } catch (e) {
        }
      };

      await Promise.all([
        readStream(stdoutReader),
        readStream(stderrReader, "\x1b[31m")
      ]);

      const result = await this.activeProc.exited;
      if (result !== 0 && result !== null) {
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.indexOf("not found") !== -1 || (e as any).code === "ENOENT") {
        this.send(`\x1b[31mCommand not found: ${cmd}\x1b[0m\r\n`);
      } else {
        this.send(`\x1b[31m[CodeBox] Failed to execute: ${msg}\x1b[0m\r\n`);
      }
    } finally {
      this.activeProc = null;
      this.onStatusCallback?.("idle");
      this.writePrompt();
    }
  }

  private handleLs(_args: string[]) {
    try {
      const files = readdirSync(this.cwd);
      if (files.length === 0) return;
      
      const formatted = files.map(f => {
        const stats = statSync(join(this.cwd, f));
        if (stats.isDirectory()) {
            return `\x1b[1;33m${f}/\x1b[0m`;
        }
        return `\x1b[34m${f}\x1b[0m`;
      }).join("  ");
      
      this.send(formatted + "\r\n");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.send(`\x1b[31mls failed: ${msg}\x1b[0m\r\n`);
    }
  }

  private handleCd(args: string[]) {
    const target = args[0] || ".";
    const newPath = this.resolveSecurePath(target);
    
    if (!newPath) {
        this.send("\x1b[31mAccess denied\x1b[0m\r\n");
        return;
    }

    if (existsSync(newPath) && statSync(newPath).isDirectory()) {
      this.cwd = newPath;
    } else {
      this.send(`\x1b[31mcd: no such directory: ${target}\x1b[0m\r\n`);
    }
  }

  private handleCat(args: string[]) {
    if (args.length === 0) {
        this.send("\x1b[31mUsage: cat <file>\x1b[0m\r\n");
        return;
    }
    try {
      const fullPath = this.resolveSecurePath(args[0]);
      if (!fullPath) {
          this.send("\x1b[31mAccess denied\x1b[0m\r\n");
          return;
      }

      if (existsSync(fullPath) && statSync(fullPath).isFile()) {
        const content = readFileSync(fullPath, "utf8");
        this.send(content.replace(/\n/g, "\r\n") + "\r\n");
      } else {
        this.send(`\x1b[31mcat: ${args[0]}: No such file\x1b[0m\r\n`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.send(`\x1b[31mcat failed: ${msg}\x1b[0m\r\n`);
    }
  }

  private async handleRun(file: string, args: string[]) {
    const fullPath = this.resolveSecurePath(file);
    if (!fullPath) {
        this.send("\x1b[31mAccess denied\x1b[0m\r\n");
        this.onStatusCallback?.("idle");
        this.writePrompt();
        return;
    }

    if (!existsSync(fullPath)) {
        this.send(`\x1b[31mFile not found: ${file}\x1b[0m\r\n`);
        this.onStatusCallback?.("idle");
        this.writePrompt();
        return;
    }

    this.send(`\x1b[2m[CodeBox] Running python3 ${file}...\x1b[0m\r\n`);
    await this.handleExternalCommand("python3", ["-u", fullPath, ...args]);
  }

  private async executeFileSystemOp(type: "move" | "delete", src: string, dest?: string) {
    try {
      const projectRoot = resolve(this.options.cwd);
      const absSrc = this.resolveSecurePath(src);
      
      if (!absSrc) {
          this.send("\x1b[31mAccess denied for source path\x1b[0m\r\n");
          return;
      }

      const relSrc = relative(projectRoot, absSrc);

      if (type === "move" && dest) {
        const absDest = this.resolveSecurePath(dest);
        if (!absDest) {
            this.send("\x1b[31mAccess denied for destination path\x1b[0m\r\n");
            return;
        }

        const relDest = relative(projectRoot, absDest);
        await Storage.changeFileDir(join(this.options.projectId || "", relSrc), join(this.options.projectId || "", relDest));
        this.send(`\x1b[2m[CodeBox] Success: ${src} -> ${dest}\x1b[0m\r\n`);
      } else if (type === "delete") {
        await Storage.delete(join(this.options.projectId || "", relSrc));
        this.send(`\x1b[2m[CodeBox] Deleted ${src}\x1b[0m\r\n`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.send(`\x1b[31m[CodeBox] Operation failed: ${msg}\x1b[0m\r\n`);
    }
  }

  private showHelp() {
    const lines = [
        "",
        "\x1b[1m\x1b[36mCodeBox Custom Shell Commands:\x1b[0m",
        "  \x1b[33mls\x1b[0m                List files in directory",
        "  \x1b[33mcd <dir>\x1b[0m          Change directory",
        "  \x1b[33mcat <file>\x1b[0m        Read file content",
        "  \x1b[33mrun <file.py>\x1b[0m     Execute a Python script",
        "  \x1b[33mmove <src> <dest>\x1b[0m Close or rename a file/folder",
        "  \x1b[33mdelete <path>\x1b[0m     Delete a file or folder",
        "  \x1b[33mclear\x1b[0m             Clear screen",
        "  \x1b[33mhelp\x1b[0m              Show this help menu",
        ""
    ];

    this.send(lines.join("\r\n"));
  }

  public resize(_cols: number, _rows: number) {
  }

  public kill() {
    if (this.activeProc) {
      this.activeProc.kill();
      this.activeProc = null;
    }
  }

  public get isActive() {
    return true;
  }
}
