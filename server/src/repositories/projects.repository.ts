import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { NewProject, Project, UpdateProject } from "@/db/types";
import { eq } from "drizzle-orm";

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

  async listAll(): Promise<Project[]> {
    return await db.select().from(projectsTable);
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
