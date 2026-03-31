import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { projectsTable } from "../schema/projects";

export type Project = InferSelectModel<typeof projectsTable>;
export type NewProject = InferInsertModel<typeof projectsTable>;
export type UpdateProject = Partial<NewProject>;
