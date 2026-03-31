import { expect, test, describe } from "bun:test";
import { StorageService } from "@/services/storage.service";
import { Storage } from "@/lib/storage";
import { join } from "node:path";

describe("Storage Service", () => {
  const projectId = "proj-service-test";
  const relativePath = "hello.txt";
  const content = "Hello CodeBox Service";
  const fsPath = join(projectId, relativePath);

  test("should create file and database record", async () => {
    const record = await StorageService.create(projectId, relativePath, content);
    
    expect(record.id).toBeDefined();
    expect(record.project_id).toBe(projectId);
    expect(record.path).toBe(relativePath);
    
    // Check if file exists on FS at the project-prefixed path
    expect(await Storage.exists(fsPath)).toBe(true);
    
    // Check if record exists in DB via service
    const found = await StorageService.findById(record.id!);
    expect(found?.path).toBe(relativePath);
  });

  test("should prevent creating existing file", async () => {
    try {
      await StorageService.create(projectId, relativePath, "duplicate");
      expect(true).toBe(false); // Should not reach here
    } catch (e: any) {
      expect(e.name).toBe("FileAlreadyExistsError");
    }
  });

  test("should read and update content", async () => {
    const record = await StorageService.findByPathAndProjectId(relativePath, projectId);
    expect(record).toBeDefined();

    const read = await StorageService.readContent(record!.id!);
    expect(read).toBe(content);

    await StorageService.updateContent(record!.id!, "Updated Content");
    const readUpdated = await StorageService.readContent(record!.id!);
    expect(readUpdated).toBe("Updated Content");
  });

  test("should move file and record", async () => {
    const record = await StorageService.findByPathAndProjectId(relativePath, projectId);
    const newRelativePath = "moved-service.txt";
    const newFsPath = join(projectId, newRelativePath);
    
    await StorageService.move(record!.id!, newRelativePath);
    
    // Original path should be gone from FS
    expect(await Storage.exists(fsPath)).toBe(false);
    
    // New path should have file and DB record
    expect(await Storage.exists(newFsPath)).toBe(true);
    const updatedRecord = await StorageService.findById(record!.id!);
    expect(updatedRecord?.path).toBe(newRelativePath);
  });

  test("should handle deletion correctly", async () => {
    const delPath = "delete-me.txt";
    const delFsPath = join(projectId, delPath);
    const record = await StorageService.create(projectId, delPath, "bye");
    await StorageService.delete(record.id!);
    
    expect(await Storage.exists(delFsPath)).toBe(false);
    const found = await StorageService.findById(record.id!);
    expect(found).toBeUndefined();
  });

  test("should delete all files in project", async () => {
    const pId = "multiple-files-proj";
    await StorageService.create(pId, "a.txt", "a");
    await StorageService.create(pId, "b.txt", "b");
    
    await StorageService.deleteAll(pId);
    
    // Check FS (folder should be gone)
    expect(await Storage.exists(pId)).toBe(false);
    
    // Check DB (record should be gone)
    const foundA = await StorageService.findByPathAndProjectId("a.txt", pId);
    expect(foundA).toBeUndefined();
  });
});
