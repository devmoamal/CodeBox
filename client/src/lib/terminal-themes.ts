import { Theme } from "@/store";

export const getTerminalTheme = (themeName: Theme) => {
  // Mapping from CSS variables/Themes to xterm colors
  const themes: Record<Theme, any> = {
    "doobox-dark": { background: "#000000", foreground: "#FFFFFF", cursor: "#2563EB", black: "#000000", blue: "#2563EB" },
    "doobox-light": { background: "#F8FAFC", foreground: "#111827", cursor: "#2563EB", black: "#1E293B", blue: "#2563EB" },
    "dracula": { background: "#1e1f29", foreground: "#f8f8f2", cursor: "#bd93f9", black: "#21222c", blue: "#bd93f9" },
    "one-dark": { background: "#21252b", foreground: "#abb2bf", cursor: "#61afef", black: "#282c34", blue: "#61afef" },
    "nord": { background: "#242933", foreground: "#d8dee9", cursor: "#88c0d0", black: "#2e3440", blue: "#88c0d0" },
    "github-dark": { background: "#0d1117", foreground: "#c9d1d9", cursor: "#1f6feb", black: "#010409", blue: "#1f6feb" },
    "solarized-dark": { background: "#073642", foreground: "#839496", cursor: "#268bd2", black: "#002b36", blue: "#268bd2" },
    "solarized-light": { background: "#eee8d5", foreground: "#657b83", cursor: "#268bd2", black: "#fdf6e3", blue: "#268bd2" },
    "coffee": { background: "#160F0A", foreground: "#E8D5B7", cursor: "#C8873A", black: "#1C1410", blue: "#C8873A" },
  };

  const t = themes[themeName] || themes["doobox-dark"];

  return {
    background: t.background,
    foreground: t.foreground,
    cursor: t.cursor,
    selectionBackground: "rgba(37, 99, 235, 0.3)",
    black: t.black,
    red: "#EF4444",
    green: "#22C55E",
    yellow: "#EAB308",
    blue: t.blue,
    magenta: "#A855F7",
    cyan: "#06B6D4",
    white: "#FFFFFF",
    brightBlack: "#4B5563",
    brightRed: "#F87171",
    brightGreen: "#4ADE80",
    brightYellow: "#FDE047",
    brightBlue: "#60A5FA",
    brightMagenta: "#C084FC",
    brightCyan: "#22D3EE",
    brightWhite: "#FFFFFF",
  };
};
