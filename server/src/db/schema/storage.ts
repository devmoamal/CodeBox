import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projectsTable } from "./projects";

export const storageTable = sqliteTable("storage", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  project_id: text("project_id")
    .references(() => projectsTable.id, { onDelete: "cascade" })
    .notNull(),
  path: text("path").notNull(),
  is_folder: integer("is_folder", { mode: "boolean" })
    .default(false)
    .notNull(),

  created_at: integer("created_at", { mode: "timestamp" })
    .$default(() => new Date())
    .notNull(),

  updated_at: integer("updated_at", { mode: "timestamp" })
    .$default(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});
