import { Link, useParams } from "@tanstack/react-router";
import { Panel, Group, Separator } from "react-resizable-panels";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor/CodeEditor";
import { Terminal } from "@/components/Terminal/Terminal";
import { useAppStore } from "@/store";
import { Loader2, ArrowLeft } from "lucide-react";
import { useProject } from "@/hooks/useProject";

export function ProjectPage() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const { activeFilePath, isSaving } = useAppStore();
  const { project, isLoading } = useProject(projectId);

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-bg font-sans overflow-hidden select-none">
      <header className="h-12 border-b border-dark-border flex items-center justify-between px-6 bg-dark-panel shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white group"
            title="Back to Projects"
          >
            <ArrowLeft
              size={18}
              className="group-active:scale-90 transition-transform"
            />
          </Link>

          <div className="flex items-center gap-3 px-4 py-1.5 bg-dark-hover/50 rounded-lg border border-white/5">
            <span className="text-sm font-bold text-gray-200 tracking-wide truncate max-w-[200px]">
              {isLoading ? (
                <Loader2 size={14} className="animate-spin inline mr-2 text-primary-blue" />
              ) : null}
              {project?.name || "Loading Project..."}
            </span>
          </div>
        </div>

        {/* Centered Path */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none transition-all duration-300">
          {activeFilePath && (
            <div className="flex items-center gap-2 bg-dark-panel/80 px-3 py-1 rounded-full border border-dark-border backdrop-blur-sm shadow-sm">
              <span className="text-xs font-mono text-gray-500">/</span>
              <span className="text-xs font-mono text-primary-blue font-medium tracking-tight">
                {activeFilePath}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto h-full">
          {isSaving && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-yellow/15 border border-primary-yellow/25 animate-pulse">
              <Loader2 size={12} className="animate-spin text-primary-yellow" />
              <span className="text-[10px] font-bold text-primary-yellow uppercase tracking-wider">
                Saving Changes
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 relative p-2 md:p-3 overflow-hidden">
        <Group orientation="horizontal" className="h-full rounded-xl overflow-hidden border border-dark-border/50 shadow-2xl">
          <Panel defaultSize={20} minSize={15} className="flex flex-col bg-dark-panel/30">
            <FileExplorer projectId={projectId} />
          </Panel>

          <Separator className="w-1.5 bg-transparent hover:bg-primary-blue/30 transition-all cursor-col-resize mx-0 group relative">
             <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-dark-border group-hover:bg-primary-blue/50" />
          </Separator>

          <Panel defaultSize={80} className="flex flex-col bg-dark-bg/20">
            <Group orientation="vertical">
              <Panel defaultSize={70} minSize={30} className="flex flex-col">
                <CodeEditor projectId={projectId} />
              </Panel>

              <Separator className="h-1.5 bg-transparent hover:bg-primary-blue/30 transition-all cursor-row-resize my-0 group relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-dark-border group-hover:bg-primary-blue/50" />
              </Separator>

              <Panel defaultSize={30} minSize={10} className="flex flex-col bg-black/10 backdrop-blur-xl">
                <Terminal projectId={projectId} />
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
