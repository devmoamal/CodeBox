import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type SidebarTab = 'files' | 'search' | 'git' | 'settings';

interface AppState {
  activeFilePath: string | null;
  openFiles: string[];
  openedFolders: Record<string, boolean>; // path -> boolean (for tree view)
  terminalCommand: string | null; // Command to send to terminal
  isSaving: boolean;
  isRunning: boolean;
  theme: 'light' | 'dark';
  panelLayouts: Record<string, Record<string, number>>; // layout-id -> { panel-id: size }
  isSidebarVisible: boolean;
  activeSidebarTab: SidebarTab;

  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  sendTerminalCommand: (command: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsRunning: (isRunning: boolean) => void;
  toggleTheme: () => void;
  setPanelLayout: (id: string, layout: Record<string, number>) => void;
  toggleSidebar: () => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme') as 'light' | 'dark';
    if (saved) return saved;
  }
  return 'dark';
};

const getInitialLayouts = (): Record<string, Record<string, number>> => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('panelLayouts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
  }
  return {};
};

const getInitialSidebarVisible = (): boolean => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('isSidebarVisible');
    return saved !== null ? saved === 'true' : true;
  }
  return true;
};

const getInitialSidebarTab = (): SidebarTab => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('activeSidebarTab') as SidebarTab;
    if (saved) return saved;
  }
  return 'files';
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
    activeSidebarTab: getInitialSidebarTab(),

    setActiveFile: (path) => set({ activeFilePath: path }),
    openFile: (path) =>
      set((state) => ({
        openFiles: state.openFiles.includes(path) ? state.openFiles : [...state.openFiles, path],
        activeFilePath: path,
      })),
    closeFile: (path) =>
      set((state) => {
        const newOpenFiles = state.openFiles.filter((f) => f !== path);
        return {
          openFiles: newOpenFiles,
          activeFilePath: state.activeFilePath === path ? newOpenFiles[newOpenFiles.length - 1] || null : state.activeFilePath,
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
    toggleTheme: () => set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return { theme: next };
    }),
    setPanelLayout: (id, layout) =>
      set((state) => {
        const newLayouts = { ...state.panelLayouts, [id]: layout };
        localStorage.setItem('panelLayouts', JSON.stringify(newLayouts));
        return { panelLayouts: newLayouts };
      }),
    toggleSidebar: () => set((state) => {
      const next = !state.isSidebarVisible;
      localStorage.setItem('isSidebarVisible', String(next));
      return { isSidebarVisible: next };
    }),
    setActiveSidebarTab: (tab) => set(() => {
      localStorage.setItem('activeSidebarTab', tab);
      return { activeSidebarTab: tab, isSidebarVisible: true };
    }),
  }))
);

// Apply theme to document
useAppStore.subscribe(
  (state) => state.theme,
  (theme) => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  },
  { fireImmediately: true }
);
