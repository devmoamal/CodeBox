import { NewProject, UpdateProject } from "@/db/types";
import { PaginationParams, PaginatedData } from "@codebox/shared";
import { projectsRepository } from "@/repositories";
import { Storage } from "@/lib/storage";

export class ProjectsService {
  static async create(data: NewProject) {
    const project = await projectsRepository.create(data);
    await Storage.createFolder(project.id);
    return project;
  }

  static async findById(id: string) {
    return await projectsRepository.findById(id);
  }

  static async listAll(params: PaginationParams) {
    const { data, total } = await projectsRepository.listAll(params);
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

  static async update(id: string, data: UpdateProject) {
    return await projectsRepository.update(id, data);
  }

  static async delete(id: string) {
    return await projectsRepository.delete(id);
  }
}
