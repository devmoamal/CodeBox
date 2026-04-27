import { useUIStore, Theme } from "@/store/uiStore";
import { Palette, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const THEMES: { id: Theme; name: string }[] = [
  { id: "theme-CodeBox-light", name: "CodeBox Light" },
  { id: "theme-CodeBox-dark", name: "CodeBox Dark" },
  { id: "theme-dracula", name: "Dracula" },
  { id: "theme-one-dark", name: "One Dark" },
  { id: "theme-nord", name: "Nord" },
  { id: "theme-github-dark", name: "GitHub Dark" },
  { id: "theme-solarized-dark", name: "Solarized Dark" },
  { id: "theme-solarized-light", name: "Solarized Light" },
  { id: "theme-coffee", name: "Coffee" },
];

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-muted hover:text-text text-sm transition-colors"
        title="Change Theme"
      >
        <Palette size={15} />
        <span className="hidden sm:inline text-xs">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-panel border border-border z-50">
          <div className="py-1 max-h-64 overflow-y-auto no-scrollbar">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-bg transition-colors ${
                  theme === t.id ? "text-primary" : "text-text"
                }`}
              >
                {t.name}
                {theme === t.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
