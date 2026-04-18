import { Terminal as TerminalIcon } from "lucide-react";

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted bg-editor-bg space-y-4">
      <div className="p-6 border border-border bg-panel">
        <TerminalIcon size={32} className="opacity-20" />
      </div>
      <div className="text-center space-y-1 px-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text">
          No File Selected
        </h3>
        <p className="text-xs text-muted max-w-[200px]">
          Select a file from the explorer to begin.
        </p>
      </div>
    </div>
  );
}
