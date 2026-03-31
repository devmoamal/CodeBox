import { env } from "@/config/env.config";
import {
  appendFile,
  copyFile,
  mkdir,
  readdir,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { logger } from "../logger";

export * from "./errors";

export class Storage {
  private static get baseDir() {
    return resolve(env.STORAGE_PATH);
  }

  static getProjectPath(projectId: string) {
    return this.baseDir.concat(`/${projectId}`);
  }

  /**
   * Resolves a path relative to the base storage directory.
   */
  static resolvePath(path: string) {
    if (
      path.startsWith("/") ||
      path.startsWith("C:") ||
      path.startsWith("file:")
    ) {
      return path;
    }
    return join(this.baseDir, path);
  }

  /**
   * Resolves a path scoped to a specific project.
   */
  static resolveProjectPath(projectId: string, relativePath: string) {
    // Ensure relativePath doesn't start with a slash to avoid global resolution
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;
    return join(this.baseDir, projectId, cleanPath);
  }

  /**
   * Checks if a file or folder exists.
   */
  static async exists(path: string) {
    return await Bun.file(this.resolvePath(path)).exists();
  }

  /**
   * Checks if the path points to a file.
   */
  static async isFile(path: string) {
    try {
      const s = await stat(this.resolvePath(path));
      return s.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Checks if the path points to a directory.
   */
  static async isFolder(path: string) {
    try {
      const s = await stat(this.resolvePath(path));
      return s.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Recursively creates a folder.
   */
  static async createFolder(path: string) {
    const fullPath = this.resolvePath(path);
    await mkdir(fullPath, { recursive: true });
    return fullPath;
  }

  /**
   * Creates or overwrites a file.
   * Auto-creates parent directories if they don't exist.
   */
  static async createFile(path: string, content: string | Buffer | Blob) {
    const fullPath = this.resolvePath(path);
    const parent = dirname(fullPath);

    // Ensure parent directory exists
    await this.createFolder(parent);

    await Bun.write(fullPath, content);
    return fullPath;
  }

  /**
   * Updates the content of a file.
   */
  static async updateFile(path: string, content: string | Buffer | Blob) {
    const fullPath = this.resolvePath(path);
    await Bun.write(fullPath, content);
    return fullPath;
  }

  /**
   * Moves or renames a file/directory.
   */
  static async changeFileDir(oldPath: string, newPath: string) {
    const oldFullPath = this.resolvePath(oldPath);
    const newFullPath = this.resolvePath(newPath);
    const newParent = dirname(newFullPath);

    // Ensure destination directory exists
    await this.createFolder(newParent);

    await rename(oldFullPath, newFullPath);
    return newFullPath;
  }

  /**
   * Appends content to an existing file.
   */
  static async appendToFile(path: string, content: string | Buffer | Blob) {
    const fullPath = this.resolvePath(path);

    if (typeof content === "string" || Buffer.isBuffer(content)) {
      await appendFile(fullPath, content);
    } else {
      const buffer = await content.arrayBuffer();
      await appendFile(fullPath, Buffer.from(buffer));
    }
    return fullPath;
  }

  /**
   * Copies a file to a new destination.
   */
  static async copy(srcPath: string, destPath: string) {
    const srcFullPath = this.resolvePath(srcPath);
    const destFullPath = this.resolvePath(destPath);
    const destParent = dirname(destFullPath);

    // Ensure destination directory exists
    await this.createFolder(destParent);

    await copyFile(srcFullPath, destFullPath);
    return destFullPath;
  }

  /**
   * Deletes a file or recursively deletes a folder.
   */
  static async delete(path: string) {
    const fullPath = this.resolvePath(path);
    await rm(fullPath, { recursive: true, force: true });
  }

  /**
   * Lists the contents of a directory.
   */
  static async ls(path: string) {
    const fullPath = this.resolvePath(path);
    return await readdir(fullPath);
  }

  /**
   * Returns the base name of a file or folder.
   */
  static getName(path: string) {
    return basename(path);
  }

  /**
   * Returns the file extension.
   */
  static getExt(path: string) {
    return extname(path);
  }

  /**
   * Gets the file size in bytes.
   */
  static async getSize(path: string) {
    const s = await stat(this.resolvePath(path));
    return s.size;
  }

  /**
   * Returns a BunFile for the path.
   * You can then call .text(), .json(), etc. on the result.
   */
  static async readFile(path: string) {
    return Bun.file(this.resolvePath(path));
  }

  /**
   * Returns the path without its extension.
   */
  static getPathWithoutExtension(path: string) {
    const ext = extname(path);
    if (!ext) return path;
    return path.slice(0, -ext.length);
  }
}
