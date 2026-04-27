import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme =
  | "theme-CodeBox-light"
  | "theme-CodeBox-dark"
  | "theme-dracula"
  | "theme-one-dark"
  | "theme-nord"
  | "theme-github-dark"
  | "theme-solarized-dark"
  | "theme-solarized-light"
  | "theme-coffee";

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "theme-CodeBox-dark",
      setTheme: (theme) => {
        // Remove all other theme classes
        const html = document.documentElement;
        const themeClasses = Array.from(html.classList).filter((c) => c.startsWith("theme-"));
        html.classList.remove(...themeClasses);
        html.classList.add(theme);
        set({ theme });
      },
    }),
    {
      name: "ui-storage",
    }
  )
);
