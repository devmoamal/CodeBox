import { useAppStore } from "@/store";
import { X, Play, Square } from "lucide-react";
import { getFileIcon } from "@/lib/icons";

export function EditorTabs() {
  const {
    openFiles,
    activeFilePath,
    setActiveFile,
    closeFile,
    isRunning,
    sendTerminalCommand,
    isTerminalVisible,
    toggleTerminal,
  } = useAppStore();

  if (openFiles.length === 0) return null;

  const handleRun = () => {
    if (!activeFilePath) return;
    if (!isTerminalVisible) toggleTerminal();
    sendTerminalCommand(`run ${activeFilePath}`);
  };

  const handleStop = () => {
    sendTerminalCommand("stop");
  };

  return (
    <div className="flex h-9 bg-panel border-b border-border overflow-x-hidden shrink-0">
      <div className="flex-1 flex overflow-x-auto no-scrollbar">
        {openFiles.map((path) => {
          const isActive = activeFilePath === path;
          const fileName = path.split("/").pop();

          return (
            <div
              key={path}
              className={`flex items-center gap-2 px-3 h-full cursor-pointer border-r border-border min-w-[100px] max-w-[200px] group ${
                isActive
                  ? "bg-bg border-b border-b-primary text-text font-medium"
                  : "text-muted hover:bg-bg hover:text-text"
              }`}
              onClick={() => setActiveFile(path)}
            >
              <span className="shrink-0">
                {getFileIcon(path, 12)}
              </span>
              <span className="text-xs truncate flex-1">
                {fileName}
              </span>
              <button
                className={`p-0.5 hover:bg-panel ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(path);
                }}
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>

      {activeFilePath?.endsWith(".py") && (
        <div className="flex items-center px-2 border-l border-border bg-panel sticky right-0">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 uppercase"
            >
              <Square size={10} fill="currentColor" /> Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="flex items-center gap-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-2 py-1 uppercase"
            >
              <Play size={10} fill="currentColor" /> Run
            </button>
          )}
        </div>
      )}
    </div>
  );
}
