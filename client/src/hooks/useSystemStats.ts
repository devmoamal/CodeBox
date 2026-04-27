import { useQuery } from "@tanstack/react-query";
import { SystemService, SystemStats } from "@/services/system.service";

export function useSystemStats() {
  return useQuery({
    queryKey: ["system-stats"],
    queryFn: () => SystemService.getStats(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export type { SystemStats };
