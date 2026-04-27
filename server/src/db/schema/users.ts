import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  username: text("username").notNull().unique(),
  
  created_at: integer("created_at", { mode: "timestamp" })
    .$default(() => new Date())
    .notNull(),
});
