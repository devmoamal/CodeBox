import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import { Theme } from "@/store";

export const getEditorTheme = (themeName: Theme) => {
  const isDark = !themeName.includes("light") && themeName !== "nord";
  
  const colors: Record<Theme, { bg: string; text: string; caret: string; selection: string }> = {
    "doobox-dark": { bg: "#000000", text: "#F8FAFC", caret: "#2563EB", selection: "rgba(37, 99, 235, 0.2)" },
    "doobox-light": { bg: "#FFFFFF", text: "#111827", caret: "#2563EB", selection: "rgba(37, 99, 235, 0.1)" },
    "dracula": { bg: "#282a36", text: "#f8f8f2", caret: "#bd93f9", selection: "rgba(189, 147, 249, 0.2)" },
    "one-dark": { bg: "#282c34", text: "#abb2bf", caret: "#61afef", selection: "rgba(97, 175, 239, 0.2)" },
    "nord": { bg: "#2e3440", text: "#d8dee9", caret: "#88c0d0", selection: "rgba(136, 192, 208, 0.2)" },
    "github-dark": { bg: "#0d1117", text: "#c9d1d9", caret: "#1f6feb", selection: "rgba(31, 111, 235, 0.2)" },
    "solarized-dark": { bg: "#002b36", text: "#839496", caret: "#268bd2", selection: "rgba(38, 139, 210, 0.2)" },
    "solarized-light": { bg: "#fdf6e3", text: "#657b83", caret: "#268bd2", selection: "rgba(38, 139, 210, 0.1)" },
  };

  const themeColors = colors[themeName] || colors["doobox-dark"];

  return createTheme({
    theme: isDark ? 'dark' : 'light',
    settings: {
      background: themeColors.bg,
      backgroundImage: '',
      foreground: themeColors.text,
      caret: themeColors.caret,
      selection: themeColors.selection, 
      selectionMatch: themeColors.selection,
      lineHighlight: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
      gutterBackground: themeColors.bg,
      gutterForeground: isDark ? '#4B5563' : '#94A3B8',
      gutterBorder: 'transparent',
    },
    styles: [
      { tag: t.comment, color: isDark ? '#6B7280' : '#94A3B8' },
      { tag: t.variableName, color: themeColors.text },
      { tag: [t.string, t.special(t.brace)], color: isDark ? '#10B981' : '#059669' }, 
      { tag: t.number, color: isDark ? '#F59E0B' : '#D97706' }, 
      { tag: t.bool, color: '#3B82F6' }, 
      { tag: t.null, color: '#3B82F6' },
      { tag: t.keyword, color: themeColors.caret },
      { tag: t.operator, color: themeColors.caret },
      { tag: t.className, color: '#8B5CF6' },
      { tag: t.definition(t.typeName), color: '#8B5CF6' },
      { tag: t.typeName, color: '#8B5CF6' },
      { tag: t.angleBracket, color: isDark ? '#94A3B8' : '#64748B' },
      { tag: t.tagName, color: '#EF4444' },
      { tag: t.attributeName, color: isDark ? '#F59E0B' : '#D97706' },
    ],
  });
};
