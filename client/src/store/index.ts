import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type SidebarTab = "files" | "search" | "git" | "settings";

export type Theme = 
  | "doobox-dark" 
  | "doobox-light" 
  | "dracula" 
  | "one-dark" 
  | "nord" 
  | "github-dark" 
  | "solarized-dark" 
  | "solarized-light";

interface AppState {
  activeFilePath: string | null;
  openFiles: string[];
  openedFolders: Record<string, boolean>; // path -> boolean (for tree view)
  terminalCommand: string | null; // Command to send to terminal
  isSaving: boolean;
  isRunning: boolean;
  theme: Theme;
  panelLayouts: Record<string, Record<string, number>>; // layout-id -> { panel-id -> size }
  isSidebarVisible: boolean;
  isTerminalVisible: boolean;
  activeSidebarTab: SidebarTab;

  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  sendTerminalCommand: (command: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsRunning: (isRunning: boolean) => void;
  setTheme: (theme: Theme) => void;
  setPanelLayout: (id: string, layout: Record<string, number>) => void;
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) return saved;
  }
  return "doobox-dark";
};

const getInitialLayouts = (): Record<string, Record<string, number>> => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("panelLayouts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure layouts are objects
        if (typeof parsed["horizontal-main"] === "object" && typeof parsed["vertical-editor-terminal"] === "object") {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
  }
  return {
    "horizontal-main": { "sidebar": 15, "main-content": 85 },
    "vertical-editor-terminal": { "editor": 65, "terminal": 35 },
  };
};

const getInitialSidebarVisible = (): boolean => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("isSidebarVisible");
    return saved !== null ? saved === "true" : true;
  }
  return true;
};

const getInitialTerminalVisible = (): boolean => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("isTerminalVisible");
    return saved !== null ? saved === "true" : false;
  }
  return false;
};

const getInitialSidebarTab = (): SidebarTab => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("activeSidebarTab") as SidebarTab;
    if (saved) return saved;
  }
  return "files";
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    activeFilePath: null,
    openFiles: [],
    openedFolders: {},
    terminalCommand: null,
    isSaving: false,
    isRunning: false,
    theme: getInitialTheme(),
    panelLayouts: getInitialLayouts(),
    isSidebarVisible: getInitialSidebarVisible(),
    isTerminalVisible: getInitialTerminalVisible(),
    activeSidebarTab: getInitialSidebarTab(),

    setActiveFile: (path) => set({ activeFilePath: path }),
    openFile: (path) =>
      set((state) => ({
        openFiles: state.openFiles.includes(path)
          ? state.openFiles
          : [...state.openFiles, path],
        activeFilePath: path,
      })),
    closeFile: (path) =>
      set((state) => {
        const newOpenFiles = state.openFiles.filter((f) => f !== path);
        return {
          openFiles: newOpenFiles,
          activeFilePath:
            state.activeFilePath === path
              ? newOpenFiles[newOpenFiles.length - 1] || null
              : state.activeFilePath,
        };
      }),
    toggleFolder: (path) =>
      set((state) => ({
        openedFolders: {
          ...state.openedFolders,
          [path]: !state.openedFolders[path],
        },
      })),
    sendTerminalCommand: (command) => set({ terminalCommand: command }),
    setIsSaving: (isSaving) => set({ isSaving }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setTheme: (theme) => {
      localStorage.setItem("theme", theme);
      set({ theme });
    },
    setPanelLayout: (id, layout) =>
      set((state) => {
        const newLayouts = { ...state.panelLayouts, [id]: layout };
        localStorage.setItem("panelLayouts", JSON.stringify(newLayouts));
        return { panelLayouts: newLayouts };
      }),
    toggleSidebar: () =>
      set((state) => {
        const next = !state.isSidebarVisible;
        localStorage.setItem("isSidebarVisible", String(next));
        return { isSidebarVisible: next };
      }),
    toggleTerminal: () =>
      set((state) => {
        const next = !state.isTerminalVisible;
        localStorage.setItem("isTerminalVisible", String(next));
        return { isTerminalVisible: next };
      }),
    setActiveSidebarTab: (tab) =>
      set(() => {
        localStorage.setItem("activeSidebarTab", tab);
        return { activeSidebarTab: tab, isSidebarVisible: true };
      }),
  })),
);

// Apply theme to document
useAppStore.subscribe(
  (state) => state.theme,
  (theme) => {
    // Remove all theme classes
    document.documentElement.className = "";
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Also add light/dark class for Tailwind's light/dark mode if needed
    if (theme.includes("light") || theme === "nord") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  },
  { fireImmediately: true },
);
