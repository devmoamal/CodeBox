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

function buildWsUrl(projectId: string): string {
  const token = localStorage.getItem("token") ?? "";
  const base =
    import.meta.env.VITE_WS_URL ??
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:3000/api`;
  return `${base}/terminal/${projectId}?token=${encodeURIComponent(token)}`;
}

export function Terminal({ projectId }: TerminalProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const aliveRef = useRef(true);

  const { theme, toggleTerminal, terminalFontSize, setTerminalFontSize } =
    useAppStore();
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();

  const sendResize = () => {
    try {
      fitRef.current?.fit();
      const dims = fitRef.current?.proposeDimensions();
      if (dims && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }),
        );
      }
    } catch {
      /* ignore */
    }
  };

  const zoomIn = () => {
    const next = Math.min(MAX_FONT, terminalFontSize + 1);
    setTerminalFontSize(next);
    if (termRef.current) {
      termRef.current.options.fontSize = next;
      setTimeout(sendResize, 0);
    }
  };

  const zoomOut = () => {
    const next = Math.max(MIN_FONT, terminalFontSize - 1);
    setTerminalFontSize(next);
    if (termRef.current) {
      termRef.current.options.fontSize = next;
      setTimeout(sendResize, 0);
    }
  };

  useEffect(() => {
    aliveRef.current = true;

    if (!mountRef.current) return;

    // Create xterm. Use convertEol: true as fallback.
    const term = new XTerm({
      cursorBlink: true,
      fontSize: useAppStore.getState().terminalFontSize,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      theme: getTerminalTheme(useAppStore.getState().theme),
      allowProposedApi: true,
      convertEol: true,
      scrollback: 5000,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    term.open(mountRef.current);
    termRef.current = term;
    fitRef.current = fit;

    requestAnimationFrame(() => {
      if (!aliveRef.current) return;
      try {
        fit.fit();
      } catch {
        /**/
      }
      term.focus();
      setTimeout(() => {
        if (!aliveRef.current) return;
        try {
          fit.fit();
        } catch {
          /**/
        }
        term.focus();
      }, 100);
    });

    const ws = new WebSocket(buildWsUrl(projectId));
    wsRef.current = ws;

    ws.onopen = () => {
      if (!aliveRef.current) return;
      setConnected(true);
      sendResize();
      term.focus();

      const cmd = useAppStore.getState().terminalCommand;
      if (cmd) {
        ws.send(cmd + "\r");
        setTimeout(() => useAppStore.getState().sendTerminalCommand(""), 0);
      }
    };

    ws.onmessage = (e) => {
      if (!aliveRef.current) return;
      const data = String(e.data);
      if (data.startsWith("__CB_STATUS__:")) {
        useAppStore.getState().setIsRunning(data.split(":")[1] === "running");
        return;
      }
      if (data === "__CB_FS_CHANGED__") {
        queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
        return;
      }
      // Write to terminal
      term.write(data);
    };

    ws.onerror = () => {
      if (aliveRef.current) setConnected(false);
    };

    ws.onclose = () => {
      if (!aliveRef.current) return;
      setConnected(false);
      term.writeln("\r\n\x1b[31m[Terminal] Disconnected\x1b[0m");
    };

    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
      }
    });

    const ro = new ResizeObserver(() => {
      if (!aliveRef.current) return;
      sendResize();
    });
    ro.observe(mountRef.current!);

    const unsub = useAppStore.subscribe(
      (s) => s.terminalCommand,
      (cmd) => {
        if (
          aliveRef.current &&
          cmd &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(cmd + "\r");
          setTimeout(() => useAppStore.getState().sendTerminalCommand(""), 0);
        }
      },
    );

    return () => {
      aliveRef.current = false;
      ro.disconnect();
      unsub();
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      wsRef.current = null;
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (termRef.current)
      termRef.current.options.theme = getTerminalTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontSize = terminalFontSize;
      setTimeout(sendResize, 0);
    }
  }, [terminalFontSize]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full w-full bg-terminal-bg overflow-hidden">
      <div className="h-8 flex items-center px-3 shrink-0 border-b border-border bg-panel gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted flex-1">
          Terminal
        </span>

        <span className="text-[10px] font-mono text-muted tabular-nums w-6 text-center">
          {terminalFontSize}
        </span>

        <button
          onClick={zoomOut}
          disabled={terminalFontSize <= MIN_FONT}
          className="p-0.5 text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Decrease font size"
        >
          <ZoomOut size={12} />
        </button>

        <button
          onClick={zoomIn}
          disabled={terminalFontSize >= MAX_FONT}
          className="p-0.5 text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Increase font size"
        >
          <ZoomIn size={12} />
        </button>

        <div
          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
          title={connected ? "Connected" : "Disconnected"}
        />

        <button
          onClick={toggleTerminal}
          className="p-0.5 text-muted hover:text-text transition-colors"
          title="Close Terminal"
        >
          <X size={12} />
        </button>
      </div>

      <div
        className="flex-1 min-h-0 relative cursor-text"
        onClick={() => termRef.current?.focus()}
      >
        <div ref={mountRef} className="absolute inset-0 px-2 py-1" />
      </div>
    </div>
  );
}
