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
   * Create a new file or folder in storage.
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
        Storage.createFile(fsPath, content ?? ""),
      );

      if (fsError) {
        throw fsError;
      }
    }

    return {
      id: relativePath,
      project_id: projectId,
      path: relativePath,
      is_folder: isFolder,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  static async findByPathAndProjectId(path: string, projectId: string) {
    const fsPath = this.getFSPath(projectId, path);
    const exists = await Storage.exists(fsPath);
    if (!exists) return undefined;

    const isFolder = await Storage.isFolder(fsPath);
    return {
      id: path,
      project_id: projectId,
      path: path,
      is_folder: isFolder,
    };
  }

  /**
   * Reads the content of a file as text.
   */
  static async readContent(projectId: string, path: string) {
    const fsPath = this.getFSPath(projectId, path);
    const exists = await Storage.exists(fsPath);
    if (!exists) throw new NotFoundError("File not found");

    const bunFile = await Storage.readFile(fsPath);
    return await bunFile.text();
  }

  /**
   * Updates the content of a file.
   */
  static async updateContent(projectId: string, path: string, content: string | Buffer | Blob) {
    const fsPath = this.getFSPath(projectId, path);
    const exists = await Storage.exists(fsPath);
    if (!exists) throw new NotFoundError("File not found");

    await Storage.updateFile(fsPath, content);
    
    return { id: path, path, updated_at: new Date() };
  }

  /**
   * Appends content to a file.
   */
  static async appendContent(projectId: string, path: string, content: string | Buffer | Blob) {
    const fsPath = this.getFSPath(projectId, path);
    const exists = await Storage.exists(fsPath);
    if (!exists) throw new NotFoundError("File not found");

    await Storage.appendToFile(fsPath, content);
    return { id: path, path, updated_at: new Date() };
  }

  /**
   * Lists all file records for a project by scanning the filesystem.
   */
  static async listAllByProjectId(projectId: string) {
    if (!(await Storage.exists(projectId))) {
      await Storage.createFolder(projectId);
    }
    
    const files = await Storage.listRecursive(projectId);
    
    return files.map(f => ({
      id: f.path,
      name: f.name,
      path: f.path,
      is_folder: f.is_folder,
      project_id: projectId,
      created_at: f.created_at,
      updated_at: f.updated_at,
    }));
  }

  /**
   * Moves a file to a new path.
   */
  static async move(projectId: string, oldRelativePath: string, newRelativePath: string) {
    const oldFsPath = this.getFSPath(projectId, oldRelativePath);
    const newFsPath = this.getFSPath(projectId, newRelativePath);

    if (await Storage.exists(newFsPath)) {
      throw new Error(`Destination already exists: ${newRelativePath}`);
    }

    await Storage.changeFileDir(oldFsPath, newFsPath);
    return { id: newRelativePath, path: newRelativePath };
  }

  /**
   * Renames a file within its current directory.
   */
  static async rename(projectId: string, path: string, newName: string) {
    const parentDir = dirname(path);
    const newRelativePath = join(parentDir, newName);

    return await this.move(projectId, path, newRelativePath);
  }

  /**
   * Copies a file to a new path.
   */
  static async copy(projectId: string, path: string, newRelativePath: string) {
    const srcFsPath = this.getFSPath(projectId, path);
    const destFsPath = this.getFSPath(projectId, newRelativePath);

    if (await Storage.exists(destFsPath)) {
      throw new Error(`Destination already exists: ${newRelativePath}`);
    }

    await Storage.copy(srcFsPath, destFsPath);
    const isFolder = await Storage.isFolder(srcFsPath);

    return {
      id: newRelativePath,
      project_id: projectId,
      path: newRelativePath,
      is_folder: isFolder,
    };
  }

  static async delete(projectId: string, path: string) {
    const fsPath = this.getFSPath(projectId, path);
    await tryCatch(Storage.delete(fsPath));
  }

  static async deleteAll(projectId: string) {
    // Delete folder from FS
    await tryCatch(Storage.delete(projectId));
  }
}
