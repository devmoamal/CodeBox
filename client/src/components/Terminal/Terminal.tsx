import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";

import { useAppStore } from "@/store";
import { getTerminalTheme } from "@/lib/terminal-themes";
import { useQueryClient } from "@tanstack/react-query";
import { X, ZoomIn, ZoomOut } from "lucide-react";

const MIN_FONT = 8;
const MAX_FONT = 24;

interface TerminalProps {
  projectId: string;
}

export function Terminal({ projectId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const isMounted = useRef(true);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme, toggleTerminal, terminalFontSize, setTerminalFontSize } = useAppStore();
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const refit = () => {
    const fitAddon = fitAddonRef.current;
    const socket = socketRef.current;
    if (!fitAddon) return;
    try {
      fitAddon.fit();
      const dims = fitAddon.proposeDimensions();
      if (dims && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
      }
    } catch (e) { /* ignore */ }
  };

  const zoomIn = () => {
    const next = Math.min(MAX_FONT, terminalFontSize + 1);
    setTerminalFontSize(next);
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = next;
      setTimeout(refit, 0);
    }
  };

  const zoomOut = () => {
    const next = Math.max(MIN_FONT, terminalFontSize - 1);
    setTerminalFontSize(next);
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = next;
      setTimeout(refit, 0);
    }
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
        fontSize: useAppStore.getState().terminalFontSize,
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
      const token = localStorage.getItem("token");
      socket = new WebSocket(`${wsUrl}/terminal/${projectId}${token ? `?token=${token}` : ""}`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted.current || !fitAddon || !socket) return;
        setIsConnected(true);
        try {
          fitAddon.fit();
          const dims = fitAddon.proposeDimensions();
          if (dims && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
          }

          const pendingCommand = useAppStore.getState().terminalCommand;
          if (pendingCommand && socket.readyState === WebSocket.OPEN) {
            socket.send(pendingCommand + "\r");
            setTimeout(() => useAppStore.getState().sendTerminalCommand(""), 0);
          }
        } catch (e) { /* ignore */ }
      };

      socket.onmessage = (event) => {
        if (!isMounted.current || !term) return;
        const data = event.data.toString();
        if (data.startsWith("__CB_STATUS__:")) {
          const status = data.split(":")[1];
          useAppStore.getState().setIsRunning(status === "running");
          return;
        }
        if (data === "__CB_FS_CHANGED__") {
          queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
          return;
        }
        term.write(data);
      };

      socket.onclose = () => {
        if (isMounted.current && xtermRef.current === term) {
          setIsConnected(false);
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
            socket.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
          }
        } catch (e) { /* ignore */ }
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    const unsubscribe = useAppStore.subscribe(
      (state) => state.terminalCommand,
      (command: string | null) => {
        if (isMounted.current && command && socket?.readyState === WebSocket.OPEN) {
          socket.send(command + "\r");
          setTimeout(() => useAppStore.getState().sendTerminalCommand(""), 0);
        }
      },
    );

    return () => {
      isMounted.current = false;
      resizeObserver?.disconnect();
      unsubscribe();
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
      if (term) term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      socketRef.current = null;
    };
  }, [projectId]);

  // Sync theme
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = getTerminalTheme(theme);
    }
  }, [theme]);

  // Sync terminalFontSize from store (e.g. if changed from settings elsewhere)
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = terminalFontSize;
      setTimeout(refit, 0);
    }
  }, [terminalFontSize]);

  return (
    <div className="flex flex-col h-full w-full bg-terminal-bg overflow-hidden">
      {/* Header bar */}
      <div className="h-8 flex items-center px-3 shrink-0 border-b border-border bg-panel gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted flex-1">
          Terminal
        </span>

        {/* Font size display */}
        <span className="text-[10px] font-mono text-muted tabular-nums w-6 text-center">
          {terminalFontSize}
        </span>

        {/* Zoom out */}
        <button
          onClick={zoomOut}
          disabled={terminalFontSize <= MIN_FONT}
          className="p-0.5 text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Decrease font size"
        >
          <ZoomOut size={12} />
        </button>

        {/* Zoom in */}
        <button
          onClick={zoomIn}
          disabled={terminalFontSize >= MAX_FONT}
          className="p-0.5 text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Increase font size"
        >
          <ZoomIn size={12} />
        </button>

        {/* Connection dot */}
        <div
          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          title={isConnected ? "Connected" : "Disconnected"}
        />

        {/* Close */}
        <button
          onClick={toggleTerminal}
          className="p-0.5 text-muted hover:text-text transition-colors"
          title="Close Terminal"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div ref={terminalRef} className="absolute inset-0 px-2 py-1" />
      </div>
    </div>
  );
}
