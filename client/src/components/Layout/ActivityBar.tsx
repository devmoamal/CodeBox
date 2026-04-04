import { useAppStore, SidebarTab } from "@/store";
import { Files, Search, GitBranch, Settings } from "lucide-react";

interface NavItemProps {
  id: SidebarTab;
  icon: React.ReactNode;
  label: string;
}

export function ActivityBar() {
  const { activeSidebarTab, isSidebarVisible, toggleSidebar, setActiveSidebarTab } = useAppStore();

  const navItems: NavItemProps[] = [
    { id: "files", icon: <Files size={20} />, label: "Files" },
    { id: "search", icon: <Search size={20} />, label: "Search" },
    { id: "git", icon: <GitBranch size={20} />, label: "Source Control" },
  ];

  const handleTabClick = (id: SidebarTab) => {
    if (activeSidebarTab === id) {
      toggleSidebar();
    } else {
      setActiveSidebarTab(id);
    }
  };

  return (
    <div className="w-[50px] flex flex-col items-center py-4 bg-panel/30 border-r border-border/30 h-full shrink-0 z-30">
      <div className="flex-1 flex flex-col gap-2 w-full">
        {navItems.map((item) => {
          const isActive = activeSidebarTab === item.id && isSidebarVisible;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`group relative flex items-center justify-center w-full py-4 transition-all duration-300 outline-none ${
                isActive 
                  ? "text-accent" 
                  : "text-text-muted hover:text-text hover:bg-white/3"
              }`}
              title={item.label}
            >
              {/* Active Indicator Pill */}
              {isActive && (
                <div className="absolute left-0 w-0.5 h-5 bg-accent rounded-r-full shadow-[0_0_8px_rgba(255,212,59,0.4)]" />
              )}

              <div className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,212,59,0.3)]' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              
              {/* Activity Dot if hidden */}
              {!isSidebarVisible && activeSidebarTab === item.id && (
                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => handleTabClick("settings")}
        className={`group flex items-center justify-center w-full py-4 transition-all duration-200 ${
          activeSidebarTab === "settings" && isSidebarVisible
            ? "text-accent border-l-2 border-accent bg-accent/5"
            : "text-text-muted hover:text-text"
        }`}
        title="Settings"
      >
        <Settings 
          size={20} 
          className={`transition-transform duration-200 ${
            activeSidebarTab === "settings" && isSidebarVisible ? 'scale-110' : 'group-hover:rotate-45'
          }`} 
        />
      </button>
    </div>
  );
}
