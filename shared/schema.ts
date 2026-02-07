import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 10 }).notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  referralCode: varchar("referral_code", { length: 10 }).notNull().unique(),
  referredBy: varchar("referred_by", { length: 10 }),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  totalReferrals: integer("total_referrals").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id", { length: 10 }).notNull(),
  toUserId: varchar("to_user_id", { length: 10 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 10 }).notNull(),
  fromUserId: varchar("from_user_id", { length: 10 }).notNull(),
  level: integer("level").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 10 }).notNull(),
  brand: varchar("brand", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  specs: text("specs"),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  isListed: boolean("is_listed").notNull().default(false),
  listPrice: decimal("list_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketListings = pgTable("market_listings", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  sellerId: varchar("seller_id", { length: 10 }).notNull(),
  sellerName: text("seller_name").notNull(),
  brand: varchar("brand", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  likes: integer("likes").notNull().default(0),
  isSold: boolean("is_sold").notNull().default(false),
  buyerId: varchar("buyer_id", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 10 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  accountDetails: text("account_details").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 10 }).notNull(),
  listingId: integer("listing_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  referredBy: true,
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  displayName: z.string().min(2),
  referralCode: z.string().min(4),
});

export const transferSchema = z.object({
  toUserId: z.string(),
  amount: z.number().positive(),
});

export const withdrawalSchema = z.object({
  amount: z.number().positive(),
  method: z.string(),
  accountDetails: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type MarketListing = typeof marketListings.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
