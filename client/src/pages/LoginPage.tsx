import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { AuthService } from "@/services/auth.service";
import { toast } from "sonner";
import { User, Loader2, Terminal, GraduationCap, Zap, Code2 } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import studentsClassroom from "@/assets/students_classroom.png";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await AuthService.login({ username });
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.username}!`);
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-bg text-text flex font-sans overflow-hidden">

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[58%] bg-panel border-r border-border overflow-hidden">

        {/* Top bar — brand only */}
        <div className="flex items-center gap-2.5 px-8 py-4 border-b border-border shrink-0">
          <Terminal size={15} className="text-primary" />
          <span className="text-xs font-bold text-text">CodeBox</span>
        </div>

        {/* Image fills the rest */}
        <div className="relative flex-1 overflow-hidden group">
          <img
            src={studentsClassroom}
            alt="College students coding"
            className="w-full h-full object-cover opacity-75 group-hover:opacity-85 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/55 to-transparent" />

          {/* Overlay text */}
          <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2">
            <h2 className="text-xl font-bold text-text leading-snug">
              Your instant coding workspace
            </h2>
            <p className="text-xs text-muted max-w-sm leading-relaxed">
              Zero setup. Write, run, and debug code directly in the browser.
              Perfect for college labs, coursework, and self-study.
            </p>
          </div>
        </div>

        {/* Bottom feature strip */}
        <div className="flex items-stretch border-t border-border shrink-0">
          {[
            { icon: <Code2 size={12} className="text-primary" />, label: "Multi-language" },
            { icon: <Zap size={12} className="text-primary" />, label: "Instant execution" },
            { icon: <GraduationCap size={12} className="text-primary" />, label: "Student-ready" },
          ].map((f, i) => (
            <div
              key={i}
              className="flex-1 flex items-center gap-2 px-5 py-3 border-r border-border last:border-r-0"
            >
              {f.icon}
              <span className="text-xs text-muted">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-bg">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-border shrink-0">
          {/* Mobile-only brand */}
          <div className="flex md:hidden items-center gap-2">
            <Terminal size={13} className="text-primary" />
            <span className="text-xs font-bold">CodeBox</span>
          </div>
          <div className="hidden md:block" />
          <ThemeSwitcher />
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center px-10 lg:px-14">
          <div className="w-full max-w-xs space-y-6">

            {/* Heading */}
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-text">Sign in</h1>
              <p className="text-xs text-muted">Enter your username to continue.</p>
            </div>

            {/* Form — no card border, just the fields */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Username
                </label>
                <div className="relative">
                  <User
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-bg border border-border focus:border-primary pl-9 pr-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted/40 font-mono"
                    placeholder="your_username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
