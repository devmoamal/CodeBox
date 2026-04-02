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

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: "#1e1e1e00", // Transparent to show parent bg
        foreground: "#d4d4d4",
        cursor: "#FFD43B",
        selectionBackground: "#3e4451",
        black: "#1e1e1e",
        brightBlack: "#808080",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:3000" : window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/api/terminal/${projectId}`);
    
    socketRef.current = socket;

    socket.onopen = () => {
      // Send initial size
      const dims = fitAddon.proposeDimensions();
      if (dims) {
        socket.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
      }
    };

    socket.onmessage = (event) => {
      const data = event.data.toString();
      if (data.startsWith("__CB_STATUS__:")) {
        const status = data.split(":")[1];
        useAppStore.getState().setIsRunning(status === "running");
        return;
      }
      term.write(data);
    };

    socket.onclose = () => {
      term.writeln("\r\n\x1b[31m[System] Terminal Disconnected\x1b[0m");
    };

    // User input handling (to socket)
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    // Listen for commands from store
    const unsubscribe = useAppStore.subscribe(
      (state) => state.terminalCommand,
      (command: string | null) => {
        if (command && socket.readyState === WebSocket.OPEN) {
          socket.send(command + "\r");
          setTimeout(() => useAppStore.getState().sendTerminalCommand(""), 0);
        }
      }
    );

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      const dims = fitAddon.proposeDimensions();
      if (dims && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      socket.close();
      term.dispose();
      resizeObserver.disconnect();
      unsubscribe();
    };
  }, [projectId]);

  return (
    <div className="flex flex-col h-full w-full bg-dark-panel rounded-xl border border-dark-border shadow-2xl overflow-hidden">
      <div className="h-7 bg-dark-panel/40 border-b border-dark-border flex items-center px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-yellow/50" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Terminal</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative bg-[#121212]">
        <div ref={terminalRef} className="absolute inset-0 p-2" />
      </div>
    </div>
  );
}
