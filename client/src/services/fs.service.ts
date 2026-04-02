import { apiClient } from "@/lib/api";
import { SuccessResponse, FileSystemNode } from "@codebox/shared";

export const FSService = {
  list: async (projectId: string): Promise<FileSystemNode[]> => {
    const response = await apiClient.get<unknown, SuccessResponse<FileSystemNode[]>>(`/storage/${projectId}`);
    return response.data || [];
  },

  readContent: async (projectId: string, path: string): Promise<string> => {
    const response = await apiClient.get<unknown, SuccessResponse<{ content: string }>>(`/storage/${projectId}`, {
      params: { path },
    });
    return response.data?.content || "";
  },

  create: async (projectId: string, path: string, isFolder: boolean = false): Promise<FileSystemNode> => {
    const response = await apiClient.post<unknown, SuccessResponse<FileSystemNode>>(`/storage/${projectId}`, {
      path,
      is_folder: isFolder,
    });
    if (!response.data) throw new Error("Failed to create resource");
    return response.data;
  },

  updateContent: async (projectId: string, path: string, content: string): Promise<void> => {
    await apiClient.put(`/storage/${projectId}`, {
      path,
      content,
    });
  },

  delete: async (projectId: string, path: string): Promise<void> => {
    await apiClient.delete(`/storage/${projectId}`, {
      data: { path },
    });
  },

  rename: async (projectId: string, oldPath: string, newPath: string): Promise<void> => {
    await apiClient.put(`/storage/${projectId}/rename`, {
      old_path: oldPath,
      new_path: newPath,
    });
  },

  upload: async (projectId: string, path: string, file: File): Promise<FileSystemNode> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);
    const response = await apiClient.post<unknown, SuccessResponse<FileSystemNode>>(`/storage/${projectId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!response.data) throw new Error("Upload failed");
    return response.data;
  },
};
