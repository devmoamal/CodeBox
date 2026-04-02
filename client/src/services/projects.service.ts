import { apiClient } from "@/lib/api";
import { PaginationParams, PaginatedData, SuccessResponse } from "@codebox/shared";

// Temporary type definition for Project until shared module is fully synced
export interface Project {
  id: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
}

type ListProjectsResponse = SuccessResponse<PaginatedData<Project>>;

export const ProjectsService = {
  list: async (params: PaginationParams): Promise<PaginatedData<Project>> => {
    const response = await apiClient.get<unknown, ListProjectsResponse>("/projects", { params });
    if (!response.data) throw new Error("No data received");
    return response.data;
  },

  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get<unknown, SuccessResponse<Project>>(`/projects/${id}`);
    if (!response.data) throw new Error("No data received");
    return response.data;
  },

  create: async (name: string): Promise<Project> => {
    const response = await apiClient.post<unknown, SuccessResponse<Project>>("/projects", { name });
    if (!response.data) throw new Error("No data received");
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
