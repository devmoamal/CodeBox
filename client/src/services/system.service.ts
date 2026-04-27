import api from "@/lib/api";
import { SystemStats } from "@codebox/shared";

export type { SystemStats };

export const SystemService = {
  getStats: async (): Promise<SystemStats> => {
    return api.get<SystemStats>("/system/stats");
  },
};
