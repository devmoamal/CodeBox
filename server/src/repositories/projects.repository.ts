import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { NewProject, Project, UpdateProject } from "@/db/types";
import { eq, count } from "drizzle-orm";
import { PaginationParams } from "@codebox/shared";

export class ProjectsRepository {
  async create(data: NewProject): Promise<Project> {
    const [project] = await db
      .insert(projectsTable)
      .values(data)
      .returning();
    return project;
  }

  async findById(id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .limit(1);
    return project;
  }

  async listAll({
    page,
    limit,
  }: PaginationParams): Promise<{ data: Project[]; total: number }> {
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(projectsTable)
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db
      .select({ value: count() })
      .from(projectsTable);

    return { data, total: totalCount.value };
  }

  async update(id: string, data: UpdateProject): Promise<Project | undefined> {
    const [project] = await db
      .update(projectsTable)
      .set(data)
      .where(eq(projectsTable.id, id))
      .returning();
    return project;
  }

  async delete(id: string): Promise<Project | undefined> {
    const [project] = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, id))
      .returning();
    return project;
  }
}

export const projectsRepository = new ProjectsRepository();
