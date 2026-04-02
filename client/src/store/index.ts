import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface AppState {
  activeFilePath: string | null;
  openFiles: string[];
  openedFolders: Record<string, boolean>; // path -> boolean (for tree view)
  terminalCommand: string | null; // Command to send to terminal
  isSaving: boolean;
  isRunning: boolean;

  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  sendTerminalCommand: (command: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsRunning: (isRunning: boolean) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    activeFilePath: null,
    openFiles: [],
    openedFolders: {},
    terminalCommand: null,
    isSaving: false,
    isRunning: false,

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
  }))
);
