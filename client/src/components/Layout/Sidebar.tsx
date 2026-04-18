import { useAppStore } from "@/store";
import { FileExplorer } from "@/components/FileExplorer";
import { SearchSidebar } from "@/components/Search/SearchSidebar";
import { SettingsSidebar } from "@/components/Settings/SettingsSidebar";

interface SidebarProps {
  projectId: string;
}

export function Sidebar({ projectId }: SidebarProps) {
  const { activeSidebarTab } = useAppStore();

  return (
    <div className="h-full border-r border-border bg-panel overflow-hidden">
      {activeSidebarTab === "files" ? (
        <FileExplorer projectId={projectId} />
      ) : activeSidebarTab === "search" ? (
        <SearchSidebar projectId={projectId} />
      ) : activeSidebarTab === "settings" ? (
        <SettingsSidebar />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {activeSidebarTab}
          </span>
        </div>
      )}
    </div>
  );
}
