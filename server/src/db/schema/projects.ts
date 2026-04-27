import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const projectsTable = sqliteTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),

  user_id: text("user_id")
    .notNull()
    .references(() => usersTable.id),

  created_at: integer("created_at", { mode: "timestamp" })
    .$default(() => new Date())
    .notNull(),

  updated_at: integer("updated_at", { mode: "timestamp" })
    .$default(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});
