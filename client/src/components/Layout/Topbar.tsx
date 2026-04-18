import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, CheckCheck } from "lucide-react";
import { useAppStore } from "@/store";

interface TopbarProps {
  projectName?: string;
  isLoading: boolean;
}

export function Topbar({ projectName, isLoading }: TopbarProps) {
  const { activeFilePath, isSaving } = useAppStore();

  // Split path into breadcrumb segments
  const pathSegments = activeFilePath ? activeFilePath.split("/") : [];
  const dirSegments = pathSegments.slice(0, -1);
  const fileName = pathSegments[pathSegments.length - 1];

  return (
    <header className="h-10 border-b border-border flex items-center justify-between px-3 bg-panel shrink-0 relative z-20">
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/"
          className="p-1 text-muted hover:text-text"
          title="Back to Projects"
        >
          <ArrowLeft size={14} />
        </Link>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-widest uppercase text-text">
            CodeBox
          </span>
          <span className="text-border text-xs">·</span>
          <span className="text-[11px] text-muted truncate max-w-[120px]">
            {isLoading ? "Loading..." : projectName}
          </span>
        </div>
      </div>

      {/* Centered breadcrumb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-0">
        {activeFilePath && (
          <div className="flex items-center gap-0.5 text-[11px] font-mono max-w-[400px] overflow-hidden">
            {dirSegments.map((seg, i) => (
              <span key={i} className="flex items-center gap-0.5 text-muted shrink-0">
                <span className="truncate max-w-[80px]">{seg}</span>
                <span className="opacity-40">/</span>
              </span>
            ))}
            <span className="font-semibold text-text shrink-0">{fileName}</span>
          </div>
        )}
      </div>

      {/* Right side save indicator */}
      <div className="flex items-center gap-2 shrink-0">
        {isSaving ? (
          <div className="flex items-center gap-1.5">
            <Loader2 size={10} className="animate-spin text-muted" />
            <span className="text-[10px] font-medium text-muted uppercase tracking-wide">
              Saving
            </span>
          </div>
        ) : activeFilePath ? (
          <div className="flex items-center gap-1.5">
            <CheckCheck size={10} className="text-muted opacity-50" />
            <span className="text-[10px] text-muted opacity-50 uppercase tracking-wide">
              Saved
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
