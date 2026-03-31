import { Storage } from "./index";
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export class FileNotFoundError extends StorageError {
  constructor(path: string) {
    super(`File or directory not found: ${path}`);
    this.name = "FileNotFoundError";
  }
}

export class FileAlreadyExistsError extends StorageError {
  constructor(path: string) {
    super(`File or directory already exists: ${Storage.getName(path)}`);
    this.name = "FileAlreadyExistsError";
  }
}
