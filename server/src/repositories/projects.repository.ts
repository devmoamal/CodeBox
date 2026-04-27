import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { NewProject, Project, UpdateProject } from "@/db/types";
import { eq, count, and } from "drizzle-orm";
import { PaginationParams } from "@codebox/shared";

export class ProjectsRepository {
  async create(data: NewProject): Promise<Project> {
    const [project] = await db
      .insert(projectsTable)
      .values(data)
      .returning();
    return project;
  }

  async findById(id: string, user_id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.user_id, user_id)))
      .limit(1);
    return project;
  }

  async listAll(
    user_id: string,
    { page, limit }: PaginationParams
  ): Promise<{ data: Project[]; total: number }> {
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.user_id, user_id))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db
      .select({ value: count() })
      .from(projectsTable)
      .where(eq(projectsTable.user_id, user_id));

    return { data, total: totalCount.value || 0 };
  }

  async update(
    id: string,
    user_id: string,
    data: UpdateProject
  ): Promise<Project | undefined> {
    const [project] = await db
      .update(projectsTable)
      .set(data)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.user_id, user_id)))
      .returning();
    return project;
  }

  async delete(id: string, user_id: string): Promise<Project | undefined> {
    const [project] = await db
      .delete(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.user_id, user_id)))
      .returning();
    return project;
  }
}

export const projectsRepository = new ProjectsRepository();
