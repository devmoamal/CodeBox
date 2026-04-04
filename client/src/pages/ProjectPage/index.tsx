import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { Panel, Group, Separator } from "react-resizable-panels";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor/CodeEditor";
import { Terminal } from "@/components/Terminal/Terminal";
import { useAppStore } from "@/store";
import { Loader2, ArrowLeft, Terminal as TerminalIcon, GitBranch, Settings } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ActivityBar } from "@/components/Layout/ActivityBar";
import { SearchSidebar } from "@/components/Search/SearchSidebar";


export function ProjectPage() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const { 
    activeFilePath, 
    isSaving, 
    panelLayouts, 
    setPanelLayout,
    isSidebarVisible,
    activeSidebarTab
  } = useAppStore();
  const { project, isLoading } = useProject(projectId);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);

  // Get initial layout from store
  const mainLayout = panelLayouts["horizontal-main"];
  const editorLayout = panelLayouts["vertical-editor-terminal"];

  return (
    <div className="h-screen w-screen flex flex-col bg-bg font-sans overflow-hidden select-none text-text transition-colors duration-300">
      <header className="mx-2 mt-2 h-[52px] border border-border/30 flex items-center justify-between px-6 bg-panel/80 backdrop-blur-2xl rounded-2xl shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-hover rounded-lg transition-colors text-text-muted hover:text-accent group"
            title="Back to Projects"
          >
            <ArrowLeft
              size={18}
              className="group-active:scale-90 transition-transform"
            />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-text">
              {isLoading ? (
                <Loader2
                  size={14}
                  className="animate-spin inline mr-2 text-accent"
                />
              ) : null}
              {project?.name || "Loading Project..."}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none transition-all duration-300">
          {activeFilePath && (
            <div className="flex items-center gap-1.5 opacity-80 group/breadcrumb pointer-events-auto cursor-default">
              <span className="text-[10px] font-mono text-text-muted/60 tracking-tight">
                {activeFilePath.split('/').slice(0, -1).join('/')}/
              </span>
              <span className="text-xs font-bold text-accent tracking-tighter drop-shadow-[0_0_10px_rgba(255,212,59,0.2)]">
                {activeFilePath.split('/').pop()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto h-full">
          {isSaving && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              <Loader2 size={12} className="animate-spin text-accent" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                Saving
              </span>
            </div>
          )}
          <div className="w-px h-4 bg-border/40" />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex min-h-0 bg-bg overflow-hidden relative p-1.5 pt-1 gap-1.5">
        <div className="flex flex-col h-full rounded-2xl border border-border/30 bg-panel overflow-hidden shrink-0">
          <ActivityBar />
        </div>
        
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <Group 
            orientation="horizontal" 
            className="h-full"
            defaultLayout={mainLayout}
            onLayoutChange={(layout: any) => setPanelLayout("horizontal-main", layout)}
          >
            {isSidebarVisible && (
              <>
                <Panel
                  id="sidebar"
                  minSize={15}
                  className="flex flex-col pr-0.5"
                >
                  <div className="h-full rounded-2xl border border-border/30 bg-panel overflow-hidden transition-all">
                    {activeSidebarTab === 'files' ? (
                      <FileExplorer projectId={projectId} />
                    ) : activeSidebarTab === 'search' ? (
                      <SearchSidebar projectId={projectId} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50 space-y-4">
                        {activeSidebarTab === 'git' && <GitBranch size={24} />}
                        {activeSidebarTab === 'settings' && <Settings size={22} />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{activeSidebarTab} Coming soon</span>
                      </div>
                    )}
                  </div>
                </Panel>
                <Separator className="w-1 bg-transparent transition-all cursor-col-resize group relative mx-0" />
              </>
            )}

            <Panel id="main-content" className="flex flex-col pl-0.5">
              <Group 
                orientation="vertical"
                defaultLayout={isTerminalVisible ? editorLayout : undefined}
                onLayoutChange={(layout: any) => setPanelLayout("vertical-editor-terminal", layout)}
              >
                <Panel
                  id="editor"
                  minSize={40}
                  className="flex flex-col pb-0.5"
                >
                  <div className="h-full rounded-2xl border border-border/30 bg-bg overflow-hidden transition-all relative group/editor">
                    <CodeEditor projectId={projectId} />

                    {/* Floating Terminal Toggle */}
                    <button
                      onClick={() => setIsTerminalVisible(!isTerminalVisible)}
                      className={`absolute bottom-4 right-4 p-2 rounded-xl border border-border/40 backdrop-blur-md shadow-xl transition-all active:scale-90 z-30 ${
                        isTerminalVisible
                          ? "bg-accent/10 text-accent"
                          : "bg-panel/80 text-text-muted hover:text-text hover:bg-panel"
                      }`}
                      title={
                        isTerminalVisible ? "Hide Terminal" : "Show Terminal"
                      }
                    >
                      <TerminalIcon
                        size={16}
                        strokeWidth={isTerminalVisible ? 3 : 2}
                      />
                    </button>
                  </div>
                </Panel>

                {isTerminalVisible && (
                  <>
                    <Separator className="h-1 bg-transparent transition-all cursor-row-resize group relative my-0" />
                    <Panel
                      id="terminal"
                      minSize={20}
                      className="flex flex-col pt-0.5"
                    >
                      <div className="h-full rounded-2xl border border-border/30 bg-panel overflow-hidden transition-all">
                        <Terminal projectId={projectId} />
                      </div>
                    </Panel>
                  </>
                )}
              </Group>
            </Panel>
          </Group>
        </div>
      </div>
    </div>
  );
}

