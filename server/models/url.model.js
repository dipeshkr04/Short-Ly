import { timestamp } from "drizzle-orm/pg-core";
import { uuid, pgTable, varchar, text } from "drizzle-orm/pg-core";
import { usersTable } from "./user.model.js";

export const urlsTable = pgTable('urls', {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersTable.id).notNull(),

    shortCode: varchar('code', { length: 155 }).notNull().unique(),
    targetURL: text('target_url').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
})