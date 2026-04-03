import { useAppStore } from "@/store";
import { File as FileIcon, X, Play, Square } from "lucide-react";

export function EditorTabs() {
  const {
    openFiles,
    activeFilePath,
    setActiveFile,
    closeFile,
    isRunning,
    sendTerminalCommand,
  } = useAppStore();

  if (openFiles.length === 0) return null;

  const handleRun = () => {
    if (!activeFilePath) return;
    sendTerminalCommand(`run ${activeFilePath}`);
  };

  const handleStop = () => {
    sendTerminalCommand("stop");
  };

  return (
    <div className="flex h-9 bg-panel border-b border-border/30 overflow-x-hidden shrink-0 transition-colors">
      <div className="flex-1 flex overflow-x-auto no-scrollbar">
        {openFiles.map((path) => {
          const isActive = activeFilePath === path;
          const fileName = path.split("/").pop();

          return (
            <div
              key={path}
              className={`flex items-center gap-2 px-3 h-full cursor-pointer border-r border-border/30 min-w-[100px] max-w-[180px] transition-all group ${
                isActive
                  ? "bg-bg text-text border-b-2 border-primary"
                  : "text-text-muted hover:bg-hover hover:text-text"
              }`}
              onClick={() => setActiveFile(path)}
            >
              <span
                className={
                  isActive
                    ? "text-primary transition-colors"
                    : "text-text-muted group-hover:text-text transition-colors"
                }
              >
                <FileIcon size={12} />
              </span>
              <span className="text-[11px] font-medium truncate flex-1 tracking-tight">
                {fileName}
              </span>
              <button
                className={`p-0.5 rounded-sm hover:bg-hover transition-colors ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(path);
                }}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Persistent Run/Stop Button in Tab Bar */}
      {activeFilePath?.endsWith(".py") && (
        <div className="flex items-center px-3 border-l border-border/30 bg-panel/50 backdrop-blur-sm sticky right-0">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-md transition-all active:scale-95 uppercase tracking-wide"
            >
              <Square size={8} fill="currentColor" /> Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-[9px] font-bold px-2.5 py-1 rounded-md transition-all active:scale-95 uppercase tracking-wide"
            >
              Run
              <Play size={8} fill="currentColor" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
