import { useAppStore, SidebarTab } from "@/store";
import { Files, Search, Settings } from "lucide-react";

interface NavItemProps {
  id: SidebarTab;
  icon: React.ReactNode;
  label: string;
}

export function ActivityBar() {
  const {
    activeSidebarTab,
    isSidebarVisible,
    toggleSidebar,
    setActiveSidebarTab,
  } = useAppStore();

  const navItems: NavItemProps[] = [
    { id: "files", icon: <Files size={20} />, label: "Files" },
    { id: "search", icon: <Search size={20} />, label: "Search" },
  ];

  const handleTabClick = (id: SidebarTab) => {
    if (activeSidebarTab === id && isSidebarVisible) {
      toggleSidebar();
    } else {
      if (!isSidebarVisible) toggleSidebar();
      setActiveSidebarTab(id);
    }
  };

  return (
    <div className="w-12 flex flex-col items-center bg-panel border-r border-border h-full shrink-0">
      <div className="flex-1 flex flex-col w-full">
        {navItems.map((item) => {
          const isActive = activeSidebarTab === item.id && isSidebarVisible;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center justify-center w-full h-12 border-l-2 ${
                isActive
                  ? "text-primary border-primary bg-primary-subtle"
                  : "text-muted border-transparent hover:text-text hover:bg-bg"
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col w-full">
        <button
          onClick={() => handleTabClick("settings")}
          className={`flex items-center justify-center w-full h-12 border-l-2 ${
            activeSidebarTab === "settings" && isSidebarVisible
              ? "text-primary border-primary bg-primary-subtle"
              : "text-muted border-transparent hover:text-text hover:bg-bg"
          }`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
