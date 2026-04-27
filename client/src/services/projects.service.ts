import api from "@/lib/api";
import { PaginationParams, PaginatedData, Project } from "@codebox/shared";

export const ProjectsService = {
  list: async (params: PaginationParams): Promise<PaginatedData<Project>> => {
    return api.get<PaginatedData<Project>>("/projects", { params });
  },

  get: async (id: string): Promise<Project> => {
    return api.get<Project>(`/projects/${id}`);
  },

  create: async (name: string): Promise<Project> => {
    return api.post<Project>("/projects", { name });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/projects/${id}`);
  },
};
