import { expect, test, describe } from "bun:test";
import { app } from "@/app";

describe("API Integration", () => {
  let projectId: string;

  test("GET /health should return ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  describe("Projects API", () => {
    test("POST /api/projects should create a project", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "API Test Project" }),
      });
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBeDefined();
      projectId = json.data.id;
    });

    test("GET /api/projects should list all", async () => {
      const res = await app.request("/api/projects");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.some((p: any) => p.id === projectId)).toBe(true);
    });

    test("GET /api/projects/:project_id should return details", async () => {
      const res = await app.request(`/api/projects/${projectId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.name).toBe("API Test Project");
    });
  });

  describe("Storage API", () => {
    test("POST /api/storage/:project_id should create a file", async () => {
      const filePath = "test.txt";
      const res = await app.request(`/api/storage/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, content: "Hello API" }),
      });
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.path).toBe(filePath);
    });

    test("POST /api/storage/:project_id should create a folder", async () => {
      const folderPath = "new-folder";
      const res = await app.request(`/api/storage/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderPath, is_folder: true }),
      });
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.path).toBe(folderPath);
      expect(json.data.is_folder).toBe(true);
    });

    test("GET /api/storage/:project_id?path=... should return content", async () => {
      const filePath = "test.txt";
      const res = await app.request(`/api/storage/${projectId}?path=${encodeURIComponent(filePath)}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.content).toBe("Hello API");
    });

    test("GET /api/projects/:project_id/files should show the file", async () => {
      const res = await app.request(`/api/projects/${projectId}/files`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data).toContain("test.txt");
    });
  });

  describe("Destruction", () => {
    test("DELETE /api/projects/:project_id should cleanup everything", async () => {
      const res = await app.request(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
      
      // Verify project is gone from DB
      const check = await app.request(`/api/projects/${projectId}`);
      expect(check.status).toBe(404);
    });
  });
});
