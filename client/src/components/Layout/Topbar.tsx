import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAppStore } from "@/store";

interface TopbarProps {
  projectName?: string;
  isLoading: boolean;
}

export function Topbar({ projectName, isLoading }: TopbarProps) {
  const { activeFilePath, isSaving } = useAppStore();

  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-bg shrink-0 relative z-20">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-1 hover:bg-panel text-muted hover:text-text"
          title="Back to Projects"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight uppercase">
            DooBox
          </span>
          <span className="text-border">|</span>
          <span className="text-sm text-text truncate max-w-[200px]">
            {isLoading ? "Loading..." : projectName}
          </span>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {activeFilePath && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted font-mono">
              {activeFilePath.split("/").slice(0, -1).join("/")}/
            </span>
            <span className="font-bold text-primary font-mono">
              {activeFilePath.split("/").pop()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isSaving && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-primary/20 bg-primary-subtle">
            <Loader2 size={10} className="animate-spin text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">
              Saving
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
