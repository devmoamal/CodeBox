import { Box } from "lucide-react";

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-editor-bg text-center select-none px-8">
      <div className="flex flex-col items-center gap-2 max-w-xs">
        {/* Logo mark */}
        <div className="w-12 h-12 border border-primary flex items-center justify-center text-primary">
          <Box size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted leading-relaxed">
            Open a file from the explorer <br /> to start editing.
          </p>
        </div>
      </div>
    </div>
  );
}
