import { db } from "@/db";
import { storageTable } from "@/db/schema";
import { NewStorage, Storage, UpdateStorage } from "@/db/types";
import { and, eq } from "drizzle-orm";

export class StorageRepository {
  async create(data: NewStorage): Promise<Storage> {
    const [item] = await db.insert(storageTable).values(data).returning();
    return item;
  }

  async findById(id: string): Promise<Storage | undefined> {
    const [item] = await db
      .select()
      .from(storageTable)
      .where(eq(storageTable.id, id))
      .limit(1);
    return item;
  }

  async findByPath(path: string): Promise<Storage | undefined> {
    const [item] = await db
      .select()
      .from(storageTable)
      .where(eq(storageTable.path, path))
      .limit(1);
    return item;
  }

  async findByPathAndProjectId(
    path: string,
    projectId: string,
  ): Promise<Storage | undefined> {
    const [item] = await db
      .select()
      .from(storageTable)
      .where(and(eq(storageTable.path, path), eq(storageTable.project_id, projectId)))
      .limit(1);
    return item;
  }

  async listAll(): Promise<Storage[]> {
    return await db.select().from(storageTable);
  }

  async listAllByProjectId(projectId: string): Promise<Storage[]> {
    return await db
      .select()
      .from(storageTable)
      .where(eq(storageTable.project_id, projectId));
  }

  async update(id: string, data: UpdateStorage): Promise<Storage | undefined> {
    const [item] = await db
      .update(storageTable)
      .set(data)
      .where(eq(storageTable.id, id))
      .returning();
    return item;
  }

  async delete(id: string): Promise<Storage | undefined> {
    const [item] = await db
      .delete(storageTable)
      .where(eq(storageTable.id, id))
      .returning();
    return item;
  }

  async deleteAllByProjectId(projectId: string): Promise<void> {
    await db.delete(storageTable).where(eq(storageTable.project_id, projectId));
  }
}

export const storageRepository = new StorageRepository();
