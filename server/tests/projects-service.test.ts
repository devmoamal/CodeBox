import { expect, test, describe } from "bun:test";
import { ProjectsService } from "@/services/projects.service";
import { Project } from "@/db/types";

describe("Projects Service", () => {
  let projectId: string;

  test("should create a project", async () => {
    const data = {
      name: "Test Project",
      description: "A test project description",
    };
    const project = await ProjectsService.create(data);
    
    expect(project.id).toBeDefined();
    expect(project.name).toBe(data.name);
    projectId = project.id!;
  });

  test("should find a project by id", async () => {
    const project = await ProjectsService.findById(projectId);
    expect(project).toBeDefined();
    expect(project?.name).toBe("Test Project");
  });

  test("should list all projects", async () => {
    const list = await ProjectsService.listAll();
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((p: Project) => p.id === projectId)).toBe(true);
  });

  test("should update a project", async () => {
    const newName = "Updated Name";
    const updated = await ProjectsService.update(projectId, { name: newName });
    expect(updated?.name).toBe(newName);
  });

  test("should delete a project", async () => {
    await ProjectsService.delete(projectId);
    const found = await ProjectsService.findById(projectId);
    expect(found).toBeUndefined();
  });
});
