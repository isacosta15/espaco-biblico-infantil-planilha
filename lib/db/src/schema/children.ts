import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { congregationsTable } from "./congregations";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  birthDate: date("birth_date", { mode: "string" }).notNull(),
  gender: text("gender", { enum: ["M", "F"] }).notNull(),
  guardianName: text("guardian_name").notNull(),
  guardianPhone: text("guardian_phone").notNull(),
  foodRestriction: boolean("food_restriction").notNull().default(false),
  foodRestrictionDescription: text("food_restriction_description"),
  autism: boolean("autism").notNull().default(false),
  observations: text("observations"),
  congregationId: integer("congregation_id").references(() => congregationsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChildSchema = createInsertSchema(childrenTable).omit({ id: true, createdAt: true });
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof childrenTable.$inferSelect;
