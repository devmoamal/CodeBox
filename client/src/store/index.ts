import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type SidebarTab = "files" | "search" | "git" | "settings";

export type Theme =
  | "CodeBox-dark"
  | "CodeBox-light"
  | "dracula"
  | "one-dark"
  | "nord"
  | "github-dark"
  | "solarized-dark"
  | "solarized-light"
  | "coffee";

interface AppState {
  activeFilePath: string | null;
  openFiles: string[];
  unsavedFiles: Set<string>;
  openedFolders: Record<string, boolean>; // path -> boolean (for tree view)
  terminalCommand: string | null; // Command to send to terminal
  isSaving: boolean;
  isRunning: boolean;
  theme: Theme;
  fontSize: number;
  terminalFontSize: number;
  panelLayouts: Record<string, Record<string, number>>;
  isSidebarVisible: boolean;
  isTerminalVisible: boolean;
  activeSidebarTab: SidebarTab;

  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  renameOpenFile: (oldPath: string, newPath: string) => void;
  removeOpenFiles: (paths: string[]) => void;
  markDirty: (path: string) => void;
  markClean: (path: string) => void;
  toggleFolder: (path: string) => void;
  sendTerminalCommand: (command: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsRunning: (isRunning: boolean) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setTerminalFontSize: (size: number) => void;
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
  return "CodeBox-light";
};

const getInitialFontSize = (): number => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("fontSize");
    const n = saved ? parseInt(saved, 10) : NaN;
    if (!isNaN(n) && n >= 10 && n <= 24) return n;
  }
  return 14;
};

const getInitialTerminalFontSize = (): number => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("terminalFontSize");
    const n = saved ? parseInt(saved, 10) : NaN;
    if (!isNaN(n) && n >= 8 && n <= 24) return n;
  }
  return 12;
};

const DEFAULT_LAYOUTS = {
  "horizontal-main": { sidebar: 22, "main-content": 78 },
  "vertical-editor-terminal": { editor: 65, terminal: 35 },
};

const isValidLayoutValue = (v: unknown) =>
  typeof v === "number" && v >= 0 && v <= 100;

const getInitialLayouts = (): Record<string, Record<string, number>> => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("panelLayouts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hMain = parsed["horizontal-main"];
        const vET = parsed["vertical-editor-terminal"];
        // Validate all values are in the 0-100 percentage range
        if (
          hMain &&
          vET &&
          isValidLayoutValue(hMain["sidebar"]) &&
          isValidLayoutValue(hMain["main-content"]) &&
          isValidLayoutValue(vET["editor"]) &&
          isValidLayoutValue(vET["terminal"])
        ) {
          return parsed;
        }
      } catch (e) {
        // Fallback to defaults
      }
      // Clear bad data
      localStorage.removeItem("panelLayouts");
    }
  }
  return DEFAULT_LAYOUTS;
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
    unsavedFiles: new Set<string>(),
    openedFolders: {},
    terminalCommand: null,
    isSaving: false,
    isRunning: false,
    theme: getInitialTheme(),
    fontSize: getInitialFontSize(),
    terminalFontSize: getInitialTerminalFontSize(),
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
        const newUnsaved = new Set(state.unsavedFiles);
        newUnsaved.delete(path);
        return {
          openFiles: newOpenFiles,
          unsavedFiles: newUnsaved,
          activeFilePath:
            state.activeFilePath === path
              ? newOpenFiles[newOpenFiles.length - 1] || null
              : state.activeFilePath,
        };
      }),
    renameOpenFile: (oldPath, newPath) =>
      set((state) => {
        const newUnsaved = new Set(state.unsavedFiles);
        if (newUnsaved.has(oldPath)) {
          newUnsaved.delete(oldPath);
          newUnsaved.add(newPath);
        }
        return {
          openFiles: state.openFiles.map((f) => (f === oldPath ? newPath : f)),
          unsavedFiles: newUnsaved,
          activeFilePath:
            state.activeFilePath === oldPath ? newPath : state.activeFilePath,
        };
      }),
    removeOpenFiles: (paths) =>
      set((state) => {
        const pathSet = new Set(paths);
        const newOpenFiles = state.openFiles.filter((f) => !pathSet.has(f));
        const newUnsaved = new Set(
          [...state.unsavedFiles].filter((p) => !pathSet.has(p)),
        );
        return {
          openFiles: newOpenFiles,
          unsavedFiles: newUnsaved,
          activeFilePath:
            state.activeFilePath && pathSet.has(state.activeFilePath)
              ? newOpenFiles[newOpenFiles.length - 1] || null
              : state.activeFilePath,
        };
      }),
    markDirty: (path) =>
      set((state) => {
        const next = new Set(state.unsavedFiles);
        next.add(path);
        return { unsavedFiles: next };
      }),
    markClean: (path) =>
      set((state) => {
        const next = new Set(state.unsavedFiles);
        next.delete(path);
        return { unsavedFiles: next };
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
    setFontSize: (size) => {
      localStorage.setItem("fontSize", String(size));
      set({ fontSize: size });
    },
    setTerminalFontSize: (size) => {
      localStorage.setItem("terminalFontSize", String(size));
      set({ terminalFontSize: size });
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

// Apply theme class to the whole document so all pages/components inherit CSS variables
useAppStore.subscribe(
  (state) => state.theme,
  (theme) => {
    document.documentElement.className = `theme-${theme}`;
  },
  { fireImmediately: true },
);
