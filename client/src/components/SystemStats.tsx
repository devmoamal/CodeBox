import { useSystemStats } from "@/hooks/useSystemStats";
import { Cpu, HardDrive, Layout, Server } from "lucide-react";

export function SystemStats() {
  const { data, isLoading } = useSystemStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-panel border border-border p-4 animate-pulse"
          >
            <div className="h-4 w-24 bg-border mb-4"></div>
            <div className="h-8 w-16 bg-border"></div>
          </div>
        ))}
      </div>
    );
  }


  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* CPU */}
      <div className="bg-panel border border-border p-4 hover:border-primary/50 transition-colors group">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-2">
            <Cpu size={12} className="text-primary" /> CPU Usage
          </span>
          <span className="text-xs font-bold font-mono text-primary">
            {data.cpu.usage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-bg h-1.5 border border-border mt-3 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${data.cpu.usage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] text-muted font-mono uppercase">
            {data.cpu.cores} Cores
          </span>
          <span className="text-[9px] text-muted font-mono uppercase truncate max-w-[120px]">
            {data.cpu.model}
          </span>
        </div>
      </div>

      {/* Memory */}
      <div className="bg-panel border border-border p-4 hover:border-primary/50 transition-colors group">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-2">
            <Server size={12} className="text-primary" /> Memory (RAM)
          </span>
          <span className="text-xs font-bold font-mono text-primary">
            {data.memory.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-bg h-1.5 border border-border mt-3 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${data.memory.percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] text-muted font-mono uppercase">
            {formatBytes(data.memory.used)} Used
          </span>
          <span className="text-[9px] text-muted font-mono uppercase">
            {formatBytes(data.memory.total)} Total
          </span>
        </div>
      </div>

      {/* Disk */}
      <div className="bg-panel border border-border p-4 hover:border-primary/50 transition-colors group">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-2">
            <HardDrive size={12} className="text-primary" /> Disk Space
          </span>
          <span className="text-xs font-bold font-mono text-primary">
            {data.disk.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-bg h-1.5 border border-border mt-3 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${data.disk.percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] text-muted font-mono uppercase">
            {formatBytes(data.disk.used)} Used
          </span>
          <span className="text-[9px] text-muted font-mono uppercase">
            {formatBytes(data.disk.total)} Total
          </span>
        </div>
      </div>
    </div>
  );
}
