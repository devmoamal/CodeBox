import { expect, test, describe } from "bun:test";
import { Storage } from "@/lib/storage";

describe("Storage Utility", () => {
  const testFile = "test.txt";
  const testContent = "Hello Bun Test";

  test("should resolve path correctly", () => {
    const resolved = Storage.resolvePath("my/path");
    expect(resolved).toContain("storage/test/my/path");
  });

  test("should create and verify folder", async () => {
    const folder = "nested/folder";
    await Storage.createFolder(folder);
    expect(await Storage.isFolder(folder)).toBe(true);
  });

  test("should create and read file", async () => {
    await Storage.createFile(testFile, testContent);
    expect(await Storage.exists(testFile)).toBe(true);
    expect(await Storage.isFile(testFile)).toBe(true);
    
    const file = await Storage.readFile(testFile);
    expect(await file.text()).toBe(testContent);
  });

  test("should append content", async () => {
    const extra = " + Appended";
    // Setup file again to be clean
    await Storage.createFile(testFile, testContent);
    await Storage.appendToFile(testFile, extra);
    const file = await Storage.readFile(testFile);
    expect(await file.text()).toBe(testContent + extra);
  });

  test("should rename/move file", async () => {
    // Setup
    await Storage.createFile(testFile, testContent);
    const newPath = "moved.txt";
    
    await Storage.changeFileDir(testFile, newPath);
    expect(await Storage.exists(testFile)).toBe(false);
    expect(await Storage.exists(newPath)).toBe(true);
    
    const file = await Storage.readFile(newPath);
    expect(await file.text()).toBe(testContent);
  });

  test("should delete file", async () => {
    const path = "delete-me.txt";
    await Storage.createFile(path, "bye");
    await Storage.delete(path);
    expect(await Storage.exists(path)).toBe(false);
  });
  
  test("should list contents", async () => {
    await Storage.createFile("ls/a.txt", "a");
    await Storage.createFile("ls/b.txt", "b");
    const list = await Storage.ls("ls");
    expect(list).toContain("a.txt");
    expect(list).toContain("b.txt");
  });
  
  test("should handle extension logic", () => {
    const path = "my.document.pdf";
    expect(Storage.getExt(path)).toBe(".pdf");
    expect(Storage.getName(path)).toBe("my.document.pdf");
    expect(Storage.getPathWithoutExtension(path)).toBe("my.document");
  });
});
