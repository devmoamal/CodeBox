import { NewProject, UpdateProject } from "@/db/types";
import { projectsRepository } from "@/repositories";

export class ProjectsService {
  static async create(data: NewProject) {
    return await projectsRepository.create(data);
  }

  static async findById(id: string) {
    return await projectsRepository.findById(id);
  }

  static async listAll() {
    return await projectsRepository.listAll();
  }

  static async update(id: string, data: UpdateProject) {
    return await projectsRepository.update(id, data);
  }

  static async delete(id: string) {
    return await projectsRepository.delete(id);
  }
}
