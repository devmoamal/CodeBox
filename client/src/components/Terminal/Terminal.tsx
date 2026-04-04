import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";

import { useAppStore } from "@/store";

interface TerminalProps {
  projectId: string;
}

export function Terminal({ projectId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const isMounted = useRef(true);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme: appTheme } = useAppStore();

  // Helper to get theme colors
  const getTheme = (theme: string) => {
    const isLight = theme === "light";
    return {
      background: isLight ? "#ffffff" : "#000000",
      foreground: isLight ? "#000000" : "#ffffff",
      cursor: "#FFD43B",
      selectionBackground: isLight ? "#e2e8f0" : "#306998",
      black: "#000000",
      red: "#f43f5e",
      green: "#10b981",
      yellow: "#FFD43B",
      blue: "#306998",
      magenta: "#8b5cf6",
      cyan: "#06b6d4",
      white: isLight ? "#64748b" : "#ffffff",
      brightBlack: isLight ? "#94a3b8" : "#4b5563",
      brightRed: "#fb7185",
      brightGreen: "#34d399",
      brightYellow: "#FFE873",
      brightBlue: "#4B8BBE",
      brightMagenta: "#a78bfa",
      brightCyan: "#22d3ee",
      brightWhite: "#ffffff",
    };
  };

  useEffect(() => {
    isMounted.current = true;
    let term: XTerm | null = null;
    let socket: WebSocket | null = null;
    let fitAddon: FitAddon | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const initTerminal = () => {
      if (!isMounted.current || !terminalRef.current || xtermRef.current)
        return;
      if (terminalRef.current.offsetWidth === 0) return;

      term = new XTerm({
        cursorBlink: true,
        fontSize: 13,
        fontWeight: "400",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        theme: getTheme(appTheme),
        allowProposedApi: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      fitAddonRef.current = fitAddon;

      term.open(terminalRef.current);
      xtermRef.current = term;

      // WebSocket Setup
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host =
        window.location.hostname === "localhost"
          ? "localhost:3000"
          : window.location.host;
      socket = new WebSocket(`${protocol}//${host}/api/terminal/${projectId}`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted.current || !fitAddon || !socket) return;
        try {
          fitAddon.fit();
          const dims = fitAddon.proposeDimensions();
          if (dims && socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "resize",
                cols: dims.cols,
                rows: dims.rows,
              }),
            );
          }
        } catch (e) {
          /* ignore */
        }
      };

      socket.onmessage = (event) => {
        if (!isMounted.current || !term) return;
        const data = event.data.toString();
        if (data.startsWith("__CB_STATUS__:")) {
          const status = data.split(":")[1];
          useAppStore.getState().setIsRunning(status === "running");
          return;
        }
        term.write(data);
      };

      socket.onclose = () => {
        if (isMounted.current && xtermRef.current === term) {
          term?.writeln("\r\n\x1b[31m[System] Terminal Disconnected\x1b[0m");
        }
      };

      term.onData((data) => {
        if (isMounted.current && socket?.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });
    };

    resizeObserver = new ResizeObserver(() => {
      if (!isMounted.current || !terminalRef.current) return;

      if (!xtermRef.current) {
        initTerminal();
      } else if (fitAddon && socket?.readyState === WebSocket.OPEN) {
        try {
          fitAddon.fit();
          const dims = fitAddon.proposeDimensions();
          if (dims) {
            socket.send(
              JSON.stringify({
                type: "resize",
                cols: dims.cols,
                rows: dims.rows,
              }),
            );
          }
        } catch (e) {
          /* ignore */
        }
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    const unsubscribe = useAppStore.subscribe(
      (state) => state.terminalCommand,
      (command: string | null) => {
        if (
          isMounted.current &&
          command &&
          socket?.readyState === WebSocket.OPEN
        ) {
          socket.send(command + "\r");
          setTimeout(() => useAppStore.getState().sendTerminalCommand(""), 0);
        }
      },
    );

    return () => {
      isMounted.current = false;
      resizeObserver?.disconnect();
      unsubscribe();
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        socket.close();
      }
      if (term) {
        term.dispose();
      }
      xtermRef.current = null;
      fitAddonRef.current = null;
      socketRef.current = null;
    };
  }, [projectId]);

  // Handle theme updates separately
  useEffect(() => {
    if (xtermRef.current) {
      try {
        xtermRef.current.options.theme = getTheme(appTheme);
      } catch (e) {
        /* ignore */
      }
    }
  }, [appTheme]);

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      <div className="h-10 flex items-center px-4 shrink-0 bg-panel/30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Terminal
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative bg-bg">
        <div
          ref={terminalRef}
          className="absolute left-0 right-0 top-0 bottom-8 px-4 pt-2"
        />
      </div>
    </div>
  );
}
