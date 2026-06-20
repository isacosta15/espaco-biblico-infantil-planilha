import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const congregationsTable = pgTable("congregations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  responsibleName: text("responsible_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCongregationSchema = createInsertSchema(congregationsTable).omit({ id: true, createdAt: true });
export type InsertCongregation = z.infer<typeof insertCongregationSchema>;
export type Congregation = typeof congregationsTable.$inferSelect;
