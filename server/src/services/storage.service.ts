import { storageRepository } from "@/repositories";
import { FileAlreadyExistsError, Storage } from "@/lib/storage";
import { tryCatch } from "@/lib/tryCatch";
import { NotFoundError } from "@/lib/error";
import { dirname, join } from "node:path";
import { logger } from "@/lib/logger";

export class StorageService {
  /**
   * Helper to get FS path from a relative path and project ID.
   */
  private static getFSPath(projectId: string, relativePath: string) {
    // Ensure relative path doesn't have leading slash for join consistency
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;
    return join(projectId, cleanPath);
  }

  /**
   * Create a new file or folder in storage and save its record in the database.
   */
  static async create(
    projectId: string,
    relativePath: string,
    content?: string | Buffer | Blob,
    isFolder: boolean = false,
  ) {
    const fsPath = this.getFSPath(projectId, relativePath);

    // 1. Check if file already exists on FS
    const exists = await Storage.exists(fsPath);
    if (exists) {
      throw new FileAlreadyExistsError(relativePath);
    }

    // 2. Create the folder or file on FS
    if (isFolder) {
      await Storage.createFolder(fsPath);
    } else {
      const { error: fsError } = await tryCatch(
        Storage.createFile(fsPath, content!),
      );

      if (fsError) {
        throw fsError;
      }
    }

    // 3. Create the record in DB (store clean relative path)
    const record = await storageRepository.create({
      project_id: projectId,
      path: relativePath,
      is_folder: isFolder,
    });

    return record;
  }

  static async findById(id: string) {
    return await storageRepository.findById(id);
  }

  static async findByPath(path: string) {
    return await storageRepository.findByPath(path);
  }

  static async findByPathAndProjectId(path: string, projectId: string) {
    return await storageRepository.findByPathAndProjectId(path, projectId);
  }

  /**
   * Reads the content of a file as text.
   */
  static async readContent(id: string) {
    const file = await storageRepository.findById(id);
    if (!file) throw new NotFoundError("File not found");

    const fsPath = this.getFSPath(file.project_id, file.path);
    const bunFile = await Storage.readFile(fsPath);
    return await bunFile.text();
  }

  /**
   * Updates the content of a file.
   */
  static async updateContent(id: string, content: string | Buffer | Blob) {
    const file = await storageRepository.findById(id);
    if (!file) throw new NotFoundError("File not found");

    const fsPath = this.getFSPath(file.project_id, file.path);
    await Storage.updateFile(fsPath, content);
    
    return await storageRepository.update(id, { updated_at: new Date() });
  }

  /**
   * Appends content to a file.
   */
  static async appendContent(id: string, content: string | Buffer | Blob) {
    const file = await storageRepository.findById(id);
    if (!file) throw new NotFoundError("File not found");

    const fsPath = this.getFSPath(file.project_id, file.path);
    await Storage.appendToFile(fsPath, content);
    return await storageRepository.update(id, { updated_at: new Date() });
  }

  static async listAll() {
    return await storageRepository.listAll();
  }

  /**
   * Lists the contents of a directory.
   */
  static async listAllByProjectId(projectId: string) {
    // Filesystem path is storage/[projectId]
    return await Storage.ls(projectId);
  }

  /**
   * Moves a file to a new path.
   */
  static async move(id: string, newRelativePath: string) {
    const file = await storageRepository.findById(id);
    if (!file) throw new NotFoundError("File record not found");

    const oldFsPath = this.getFSPath(file.project_id, file.path);
    const newFsPath = this.getFSPath(file.project_id, newRelativePath);

    if (await Storage.exists(newFsPath)) {
      throw new Error(`Destination already exists: ${newRelativePath}`);
    }

    await Storage.changeFileDir(oldFsPath, newFsPath);
    return await storageRepository.update(id, { path: newRelativePath });
  }

  /**
   * Renames a file within its current directory.
   */
  static async rename(id: string, newName: string) {
    const file = await storageRepository.findById(id);
    if (!file) throw new NotFoundError("File record not found");

    const parentDir = dirname(file.path);
    const newRelativePath = join(parentDir, newName);

    return await this.move(id, newRelativePath);
  }

  /**
   * Copies a file to a new path and creates a new DB record.
   */
  static async copy(id: string, newRelativePath: string) {
    const file = await storageRepository.findById(id);
    if (!file) throw new NotFoundError("File record not found");

    const srcFsPath = this.getFSPath(file.project_id, file.path);
    const destFsPath = this.getFSPath(file.project_id, newRelativePath);

    if (await Storage.exists(destFsPath)) {
      throw new Error(`Destination already exists: ${newRelativePath}`);
    }

    await Storage.copy(srcFsPath, destFsPath);
    return await storageRepository.create({
      project_id: file.project_id,
      path: newRelativePath,
      is_folder: file.is_folder,
    });
  }

  static async delete(id: string) {
    const record = await storageRepository.findById(id);
    if (record) {
      const fsPath = this.getFSPath(record.project_id, record.path);
      // Delete from FS
      await tryCatch(Storage.delete(fsPath));
    }
    // Delete from DB
    return await storageRepository.delete(id);
  }

  static async deleteAll(projectId: string) {
    // Delete folder from FS
    await tryCatch(Storage.delete(projectId));
    
    // Delete all records from DB
    const files = await storageRepository.listAllByProjectId(projectId);
    for (const file of files) {
      await storageRepository.delete(file.id);
    }
  }
}
