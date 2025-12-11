import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const players = pgTable("players", {
  storageId: text("storage_id").primaryKey(), // UUID из localStorage
  telegramChatId: text("telegram_chat_id"), // ID чата в телеграм
  lastPromoCode: text("last_promo_code"), // Последний выигранный код
  isConnected: boolean("is_connected").default(false),
});

export const insertPlayerSchema = createInsertSchema(players);
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
