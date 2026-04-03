import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/store";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-hover rounded-lg transition-colors text-text-muted hover:text-text group"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? (
        <Moon size={18} className="group-active:scale-90 transition-transform" />
      ) : (
        <Sun size={18} className="group-active:scale-90 transition-transform" />
      )}
    </button>
  );
}
