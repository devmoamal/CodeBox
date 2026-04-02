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
    <div className="flex h-9 bg-dark-panel border-b border-dark-border overflow-x-hidden shrink-0">
      <div className="flex-1 flex overflow-x-auto no-scrollbar">
        {openFiles.map((path) => {
          const isActive = activeFilePath === path;
          const fileName = path.split("/").pop();

          return (
            <div
              key={path}
              className={`flex items-center gap-2 px-4 h-full cursor-pointer border-r border-dark-border min-w-[120px] max-w-[200px] transition-all group ${
                isActive
                  ? "bg-dark-bg text-primary-blue border-b-2 border-b-primary-blue"
                  : "text-gray-500 hover:bg-dark-hover hover:text-gray-300"
              }`}
              onClick={() => setActiveFile(path)}
            >
              <span
                className={
                  isActive
                    ? "text-primary-blue"
                    : "text-gray-500 group-hover:text-gray-400"
                }
              >
                <FileIcon size={12} />
              </span>
              <span className="text-[11px] font-medium truncate flex-1">
                {fileName}
              </span>
              <button
                className={`p-0.5 rounded-md hover:bg-dark-bg/50 transition-colors ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(path);
                }}
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Persistent Run/Stop Button in Tab Bar */}
      {activeFilePath?.endsWith(".py") && (
        <div className="flex items-center px-3 border-l border-dark-border bg-dark-panel/80 backdrop-blur-sm sticky right-0">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded transition-all active:scale-95 shadow-lg shadow-red-500/10 border border-red-400/20 uppercase tracking-tighter"
            >
              <Square size={10} fill="currentColor" /> Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 bg-primary-blue hover:bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-500/10 border border-blue-400/20 uppercase tracking-tighter"
            >
              Run
              <Play size={10} fill="currentColor" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
