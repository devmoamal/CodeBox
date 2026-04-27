import api from "@/lib/api";
import { FileSystemNode } from "@codebox/shared";

export const FSService = {
  list: async (projectId: string): Promise<FileSystemNode[]> => {
    return api.get<FileSystemNode[]>(`/storage/${projectId}`);
  },

  readContent: async (projectId: string, path: string): Promise<string> => {
    const data = await api.get<{ content: string }>(`/storage/${projectId}`, {
      params: { path },
    });
    return data.content;
  },

  create: async (projectId: string, path: string, isFolder: boolean = false): Promise<FileSystemNode> => {
    return api.post<FileSystemNode>(`/storage/${projectId}`, {
      path,
      is_folder: isFolder,
    });
  },

  updateContent: async (projectId: string, path: string, content: string): Promise<void> => {
    await api.put(`/storage/${projectId}`, {
      path,
      content,
    });
  },

  delete: async (projectId: string, path: string): Promise<void> => {
    await api.delete(`/storage/${projectId}`, {
      data: { path },
    });
  },

  rename: async (projectId: string, oldPath: string, newPath: string): Promise<void> => {
    await api.put(`/storage/${projectId}/rename`, {
      old_path: oldPath,
      new_path: newPath,
    });
  },

  upload: async (projectId: string, path: string, file: File): Promise<FileSystemNode> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);
    return api.post<FileSystemNode>(`/storage/${projectId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
