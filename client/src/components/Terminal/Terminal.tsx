import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";

import { useAppStore } from "@/store";
import { getTerminalTheme } from "@/lib/terminal-themes";

interface TerminalProps {
  projectId: string;
}

export function Terminal({ projectId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const isMounted = useRef(true);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme } = useAppStore();

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
        fontSize: 12,
        fontWeight: "400",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        theme: getTerminalTheme(theme),
        allowProposedApi: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      fitAddonRef.current = fitAddon;

      term.open(terminalRef.current);
      xtermRef.current = term;

      const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3000/api`;
      socket = new WebSocket(`${wsUrl}/terminal/${projectId}`);
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

          const pendingCommand = useAppStore.getState().terminalCommand;
          if (pendingCommand && socket.readyState === WebSocket.OPEN) {
            socket.send(pendingCommand + "\r");
            setTimeout(() => useAppStore.getState().sendTerminalCommand(""), 0);
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

  // Update theme when store theme changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = getTerminalTheme(theme);
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-full w-full bg-terminal-bg overflow-hidden">
      <div className="h-8 flex items-center px-4 shrink-0 border-b border-border bg-panel">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Terminal
        </span>
      </div>
      <div className="flex-1 min-h-0 relative">
        <div
          ref={terminalRef}
          className="absolute inset-0 px-2 py-1"
        />
      </div>
    </div>
  );
}
