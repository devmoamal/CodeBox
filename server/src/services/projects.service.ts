import { NewProject, UpdateProject } from "@/db/types/projects";
import { PaginationParams, PaginatedData } from "@codebox/shared";
import { projectsRepository } from "@/repositories";
import { Storage } from "@/lib/storage";

export class ProjectsService {
  static async create(data: NewProject & { user_id: string }) {
    const project = await projectsRepository.create(data);
    await Storage.createFolder(project.id);
    return project;
  }

  static async findById(id: string, user_id: string) {
    return await projectsRepository.findById(id, user_id);
  }

  static async listAll(user_id: string, params: PaginationParams) {
    const { data, total } = await projectsRepository.listAll(user_id, params);
    return {
      data,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  static async update(id: string, user_id: string, data: UpdateProject) {
    return await projectsRepository.update(id, user_id, data);
  }

  static async delete(id: string, user_id: string) {
    return await projectsRepository.delete(id, user_id);
  }
}
