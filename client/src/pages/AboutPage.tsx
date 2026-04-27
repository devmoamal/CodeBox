import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Cat,
  Info,
  Server,
  Cpu,
  HardDrive,
  User,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSystemStats } from "@/hooks/useSystemStats";

export function AboutPage() {
  const { data } = useSystemStats();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-bg text-text p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-12 pb-6 border-b border-border">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="p-3 border border-border hover:border-primary transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">
                System Info
              </h1>
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">
                Node Configuration & Status
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="bg-panel border border-border p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-muted">
              <User size={14} className="text-primary" /> Identity Profile
            </h2>
            <div className="space-y-6 font-mono text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted uppercase tracking-tighter opacity-50">Local Alias</span>
                <span className="font-black text-primary">@{user?.username || "ANONYMOUS"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted uppercase tracking-tighter opacity-50">UUID Token</span>
                <span className="font-bold tracking-tighter">{user?.id || "NULL_DESCRIPTOR"}</span>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-border p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-muted">
              <Server size={14} className="text-primary" /> Hardware Layer
            </h2>
            <div className="space-y-6 font-mono text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted uppercase tracking-tighter opacity-50">Runtime Host</span>
                <span className="font-black">{data?.platform || "COLLECTING..."}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted uppercase tracking-tighter opacity-50">ISA Architecture</span>
                <span className="font-black">{data?.arch || "COLLECTING..."}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted uppercase tracking-tighter opacity-50">Logic Core</span>
                <span className="font-bold truncate max-w-[200px] text-right italic">
                  {data?.cpu.model || "COLLECTING..."}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted uppercase tracking-tighter opacity-50">Active Session</span>
                <span className="font-black text-primary">
                  {data ? (data.uptime / 3600).toFixed(2) : 0} HRS_UPTIME
                </span>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-border p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-muted">
              <Cat size={14} className="text-primary" /> Manifest
            </h2>
            <p className="text-xs text-muted leading-relaxed mb-8 font-bold uppercase tracking-tight opacity-70">
              CodeBox is an advanced agentic coding environment built for elite 
              developer workflows, providing real-time synchronization and 
              distributed processing.
            </p>
            <div className="flex items-center gap-8">
              <a
                href="#"
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-8 decoration-2"
              >
                INFRASTRUCTURE_DOCS
              </a>
              <a
                href="#"
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-8 decoration-2"
              >
                GITHUB_VCS
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-border text-center">
          <div className="inline-block p-2 border border-border mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <p className="text-[10px] text-muted font-black uppercase tracking-[0.5em]">
            &copy; 2026 CODEBOX_CORP.LTD
          </p>
        </footer>
      </div>
    </div>
  );
}
