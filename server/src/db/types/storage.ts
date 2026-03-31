import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { storageTable } from "../schema/storage";

export type Storage = InferSelectModel<typeof storageTable>;
export type NewStorage = InferInsertModel<typeof storageTable>;
export type UpdateStorage = Partial<NewStorage>;
