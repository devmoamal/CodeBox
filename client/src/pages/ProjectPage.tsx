import { useParams } from "@tanstack/react-router";
import { Panel, Group, Separator } from "react-resizable-panels";
import { CodeEditor } from "@/components/CodeEditor/CodeEditor";
import { Terminal } from "@/components/Terminal/Terminal";
import { useAppStore } from "@/store";
import { Terminal as TerminalIcon } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { ActivityBar } from "@/components/Layout/ActivityBar";
import { Topbar } from "@/components/Layout/Topbar";
import { Sidebar } from "@/components/Layout/Sidebar";

export function ProjectPage() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const {
    panelLayouts,
    setPanelLayout,
    isSidebarVisible,
    isTerminalVisible,
    toggleTerminal,
  } = useAppStore();
  const { project, isLoading } = useProject(projectId);

  const mainLayout = panelLayouts["horizontal-main"];
  const editorLayout = panelLayouts["vertical-editor-terminal"];

  return (
    <div className="h-screen w-screen flex flex-col bg-bg font-sans overflow-hidden select-none text-text">
      <Topbar projectName={project?.name} isLoading={isLoading} />

      <div className="flex-1 flex min-h-0 bg-bg overflow-hidden">
        <ActivityBar />

        <div className="flex-1 min-h-0 relative overflow-hidden">
          <Group
            orientation="horizontal"
            className="h-full"
            onLayoutChange={(layout) =>
              setPanelLayout("horizontal-main", layout)
            }
          >
            {isSidebarVisible && (
              <>
                <Panel
                  id="sidebar"
                  minSize={5}
                  defaultSize={mainLayout["sidebar"]}
                >
                  <Sidebar projectId={projectId} />
                </Panel>
                <Separator className="w-px bg-border hover:bg-primary cursor-col-resize" />
              </>
            )}

            <Panel
              id="main-content"
              defaultSize={isSidebarVisible ? mainLayout["main-content"] : 100}
            >
              <Group
                orientation="vertical"
                className="h-full"
                onLayoutChange={(layout) =>
                  setPanelLayout("vertical-editor-terminal", layout)
                }
              >
                <Panel
                  id="editor"
                  minSize={20}
                  defaultSize={isTerminalVisible ? editorLayout["editor"] : 100}
                >
                  <div className="h-full bg-editor-bg overflow-hidden relative">
                    <CodeEditor projectId={projectId} />

                    <button
                      onClick={toggleTerminal}
                      className={`absolute bottom-4 right-4 p-1.5 border z-30 ${
                        isTerminalVisible
                          ? "bg-primary border-primary text-white"
                          : "bg-panel border-border text-muted hover:text-text hover:border-muted"
                      }`}
                      title={
                        isTerminalVisible ? "Hide Terminal" : "Show Terminal"
                      }
                    >
                      <TerminalIcon size={14} />
                    </button>
                  </div>
                </Panel>

                {isTerminalVisible && (
                  <>
                    <Separator className="h-px bg-border hover:bg-primary cursor-row-resize" />
                    <Panel
                      id="terminal"
                      minSize={100}
                      maxSize={200}
                      defaultSize={editorLayout["terminal"]}
                    >
                      <div className="h-full bg-terminal-bg overflow-hidden">
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
