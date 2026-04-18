import { useParams } from "@tanstack/react-router";
import {
  Panel,
  Group,
  Separator,
  usePanelCallbackRef,
} from "react-resizable-panels";
import { CodeEditor } from "@/components/CodeEditor/CodeEditor";
import { Terminal } from "@/components/Terminal/Terminal";
import { useAppStore } from "@/store";
import { Terminal as TerminalIcon } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { ActivityBar } from "@/components/Layout/ActivityBar";
import { Topbar } from "@/components/Layout/Topbar";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useEffect, useRef } from "react";

export function ProjectPage() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const {
    setPanelLayout,
    panelLayouts,
    isSidebarVisible,
    isTerminalVisible,
    toggleTerminal,
  } = useAppStore();
  const { project, isLoading } = useProject(projectId);

  // Imperative panel refs
  const [sidebarPanel, setSidebarPanel] = usePanelCallbackRef();
  const [terminalPanel, setTerminalPanel] = usePanelCallbackRef();

  // Track previous values so we only react to CHANGES, not initial mount
  const prevSidebar = useRef<boolean | null>(null);
  const prevTerminal = useRef<boolean | null>(null);

  // Sidebar: drive collapse/expand imperatively only on change
  useEffect(() => {
    if (!sidebarPanel) return;

    if (prevSidebar.current === null) {
      // First render — just set initial state, don't toggle
      prevSidebar.current = isSidebarVisible;
      if (!isSidebarVisible) sidebarPanel.collapse();
      return;
    }

    if (prevSidebar.current === isSidebarVisible) return;
    prevSidebar.current = isSidebarVisible;

    if (isSidebarVisible) {
      sidebarPanel.expand();
    } else {
      sidebarPanel.collapse();
    }
  }, [isSidebarVisible, sidebarPanel]);

  // Terminal: same pattern
  useEffect(() => {
    if (!terminalPanel) return;

    if (prevTerminal.current === null) {
      prevTerminal.current = isTerminalVisible;
      if (!isTerminalVisible) terminalPanel.collapse();
      return;
    }

    if (prevTerminal.current === isTerminalVisible) return;
    prevTerminal.current = isTerminalVisible;

    if (isTerminalVisible) {
      terminalPanel.expand();
    } else {
      terminalPanel.collapse();
    }
  }, [isTerminalVisible, terminalPanel]);

  return (
    <div className="h-screen w-screen flex flex-col bg-bg font-sans overflow-hidden select-none text-text">
      <Topbar projectName={project?.name} isLoading={isLoading} />

      <div className="flex-1 flex min-h-0 bg-bg overflow-hidden">
        <ActivityBar />

        <div className="flex-1 min-h-0 overflow-hidden">
          {/* ── Horizontal: Sidebar | Main ── */}
          <Group
            orientation="horizontal"
            className="h-full"
            defaultLayout={panelLayouts["horizontal-main"] ?? { sidebar: 22, "main-content": 78 }}
            onLayoutChanged={(layout) =>
              setPanelLayout("horizontal-main", layout)
            }
          >
            <Panel
              id="sidebar"
              panelRef={setSidebarPanel}
              collapsible
              collapsedSize={0}
              minSize="160px"
              maxSize={350}
              defaultSize="260px"
            >
              <Sidebar projectId={projectId} />
            </Panel>

            <Separator className="w-px bg-border hover:bg-primary transition-colors cursor-col-resize shrink-0" />

            <Panel id="main-content" minSize="400px">
              {/* ── Vertical: Editor | Terminal ── */}
              <Group
                orientation="vertical"
                className="h-full"
                defaultLayout={panelLayouts["vertical-editor-terminal"] ?? { editor: 65, terminal: 35 }}
                onLayoutChanged={(layout) =>
                  setPanelLayout("vertical-editor-terminal", layout)
                }
              >
                <Panel id="editor" minSize="150px" defaultSize="60%">
                  <div className="h-full bg-editor-bg overflow-hidden relative">
                    <CodeEditor projectId={projectId} />

                    <button
                      onClick={toggleTerminal}
                      className={`absolute bottom-4 right-4 p-1.5 border z-30 transition-colors ${
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

                <Separator className="h-px bg-border hover:bg-primary transition-colors cursor-row-resize shrink-0" />

                <Panel
                  id="terminal"
                  panelRef={setTerminalPanel}
                  collapsible
                  collapsedSize={0}
                  minSize="80px"
                  maxSize={500}
                  defaultSize="250px"
                >
                  <div className="h-full bg-terminal-bg overflow-hidden">
                    <Terminal projectId={projectId} />
                  </div>
                </Panel>
              </Group>
            </Panel>
          </Group>
        </div>
      </div>
    </div>
  );
}
