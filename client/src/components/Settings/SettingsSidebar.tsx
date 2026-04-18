import { useAppStore, Theme } from "@/store";
import { Palette, Check } from "lucide-react";

const themes: { id: Theme; name: string; color: string }[] = [
  { id: "doobox-dark", name: "DooBox Dark", color: "#000000" },
  { id: "doobox-light", name: "DooBox Light", color: "#FFFFFF" },
  { id: "dracula", name: "Dracula", color: "#282a36" },
  { id: "one-dark", name: "One Dark", color: "#282c34" },
  { id: "nord", name: "Nord", color: "#2e3440" },
  { id: "github-dark", name: "GitHub Dark", color: "#0d1117" },
  { id: "solarized-dark", name: "Solarized Dark", color: "#002b36" },
  { id: "solarized-light", name: "Solarized Light", color: "#fdf6e3" },
];

export function SettingsSidebar() {
  const { theme, setTheme } = useAppStore();

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted uppercase tracking-tighter font-bold text-[10px]">
            <Palette size={12} />
            <span>Themes</span>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-3 p-2 border ${
                  theme === t.id 
                    ? 'border-primary bg-primary-subtle text-primary' 
                    : 'border-border text-muted hover:border-muted hover:bg-bg'
                }`}
              >
                <div 
                  className="w-4 h-4 border border-border" 
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-[11px] font-bold uppercase flex-1 text-left">{t.name}</span>
                {theme === t.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
