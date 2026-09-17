import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  uid: text("uid").notNull().unique(),
  label: text("label").notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
  // Snapshot of the tag's task at tap time — see AGENTS.md for why this
  // isn't just derived by joining through tags at read time.
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasksRelations = relations(tasks, ({ many }) => ({
  tags: many(tags),
  events: many(events),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  task: one(tasks, { fields: [tags.taskId], references: [tasks.id] }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  tag: one(tags, { fields: [events.tagId], references: [tags.id] }),
  task: one(tasks, { fields: [events.taskId], references: [tasks.id] }),
}));
