import { useAppStore, Theme } from "@/store";
import { Palette, Type, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const themes: { id: Theme; name: string; bg: string; fg: string }[] = [
  { id: "CodeBox-dark", name: "CodeBox Dark", bg: "#000000", fg: "#F8FAFC" },
  { id: "CodeBox-light", name: "CodeBox Light", bg: "#FFFFFF", fg: "#111827" },
  { id: "dracula", name: "Dracula", bg: "#282a36", fg: "#f8f8f2" },
  { id: "one-dark", name: "One Dark", bg: "#282c34", fg: "#abb2bf" },
  { id: "nord", name: "Nord", bg: "#2e3440", fg: "#d8dee9" },
  { id: "github-dark", name: "GitHub Dark", bg: "#0d1117", fg: "#c9d1d9" },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    bg: "#002b36",
    fg: "#839496",
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    bg: "#fdf6e3",
    fg: "#657b83",
  },
  { id: "coffee", name: "Coffee", bg: "#1C1410", fg: "#E8D5B7" },
];

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24];

export function SettingsSidebar() {
  const { theme, setTheme, fontSize, setFontSize } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = themes.find((t) => t.id === theme) ?? themes[0];

  // Close both dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(e.target as Node)
      ) {
        setFontDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Settings
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ── Color Theme ── */}
        <section className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            <Palette size={11} />
            Color Theme
          </label>

          {/* Dropdown trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full flex items-center gap-2 p-2 border border-border bg-bg hover:border-muted transition-colors"
            >
              {/* Active theme swatch */}
              <div
                className="w-7 h-4 border border-border shrink-0 flex items-center justify-center"
                style={{ backgroundColor: activeTheme.bg }}
              >
                <span
                  className="text-[8px] font-bold"
                  style={{ color: activeTheme.fg }}
                >
                  Aa
                </span>
              </div>
              <span className="text-xs flex-1 text-left text-text">
                {activeTheme.name}
              </span>
              <ChevronDown
                size={12}
                className={`text-muted shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 border border-border bg-panel mt-px max-h-64 overflow-y-auto">
                {themes.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "bg-primary-subtle text-primary"
                          : "text-muted hover:bg-bg hover:text-text"
                      }`}
                    >
                      <div
                        className="w-6 h-3.5 border border-border shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: t.bg }}
                      >
                        <span
                          className="text-[7px] font-bold"
                          style={{ color: t.fg }}
                        >
                          Aa
                        </span>
                      </div>
                      <span className="text-xs flex-1">{t.name}</span>
                      {isActive && <Check size={11} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Font Size ── */}
        <section className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            <Type size={11} />
            Font Size
          </label>

          <div className="relative" ref={fontDropdownRef}>
            {/* Dropdown trigger */}
            <button
              onClick={() => setFontDropdownOpen((o) => !o)}
              className="w-full flex items-center gap-2 p-2 border border-border bg-bg hover:border-muted transition-colors"
            >
              <span className="text-xs font-mono text-text flex-1 text-left">
                {fontSize}px
              </span>
              <ChevronDown
                size={12}
                className={`text-muted shrink-0 transition-transform ${fontDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown list */}
            {fontDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 border border-border bg-panel mt-px max-h-48 overflow-y-auto">
                {FONT_SIZES.map((s) => {
                  const isActive = fontSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setFontSize(s);
                        setFontDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 transition-colors ${
                        isActive
                          ? "bg-primary-subtle text-primary"
                          : "text-muted hover:bg-bg hover:text-text"
                      }`}
                    >
                      <span className="text-xs font-mono">{s}px</span>
                      {isActive && <Check size={11} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
