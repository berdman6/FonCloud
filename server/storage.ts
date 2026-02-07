import {
  type User,
  type InsertUser,
  type Transaction,
  type Commission,
  type Device,
  type MarketListing,
  type Withdrawal,
  type Notification,
  users,
  transactions,
  commissions,
  devices,
  marketListings,
  withdrawals,
  likes,
  notifications,
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";

function generateId(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: number): Promise<void>;
  incrementReferralCount(userId: string): Promise<void>;

  createTransaction(data: {
    fromUserId: string;
    toUserId: string;
    amount: string;
    type: string;
    description?: string;
  }): Promise<Transaction>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;

  createCommission(data: {
    userId: string;
    fromUserId: string;
    level: number;
    amount: string;
  }): Promise<Commission>;
  getCommissionsByUserId(userId: string): Promise<Commission[]>;

  createDevice(data: {
    userId: string;
    brand: string;
    model: string;
    specs: string;
    value: string;
  }): Promise<Device>;
  getDevicesByUserId(userId: string): Promise<Device[]>;
  getDevicesTodayCount(userId: string): Promise<number>;
  getDeviceById(id: number): Promise<Device | undefined>;
  updateDeviceListing(
    id: number,
    isListed: boolean,
    listPrice: string | null,
  ): Promise<void>;

  createListing(data: {
    deviceId: number;
    sellerId: string;
    sellerName: string;
    brand: string;
    model: string;
    price: string;
  }): Promise<MarketListing>;
  getListings(): Promise<MarketListing[]>;
  getListingById(id: number): Promise<MarketListing | undefined>;
  updateListingLikes(id: number, delta: number): Promise<void>;
  buyListing(id: number, buyerId: string): Promise<void>;

  createWithdrawal(data: {
    userId: string;
    amount: string;
    method: string;
    accountDetails: string;
  }): Promise<Withdrawal>;
  getWithdrawalsByUserId(userId: string): Promise<Withdrawal[]>;

  createLike(data: {
    userId: string;
    listingId: number;
  }): Promise<{ id: number }>;
  getLikeByUserAndListing(
    userId: string,
    listingId: number,
  ): Promise<{ id: number } | undefined>;
  deleteLike(id: number): Promise<void>;

  createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
  }): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  markNotificationRead(id: number, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userId = generateId(6);
    const referralCode = generateId(8);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        userId,
        referralCode,
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    if (amount >= 0) {
      await db
        .update(users)
        .set({
          walletBalance: sql`${users.walletBalance} + ${amount.toFixed(2)}`,
          totalEarnings: sql`${users.totalEarnings} + ${amount.toFixed(2)}`,
        })
        .where(eq(users.userId, userId));
    } else {
      await db
        .update(users)
        .set({
          walletBalance: sql`${users.walletBalance} + ${amount.toFixed(2)}`,
        })
        .where(eq(users.userId, userId));
    }
  }

  async incrementReferralCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        totalReferrals: sql`${users.totalReferrals} + 1`,
      })
      .where(eq(users.userId, userId));
  }

  async createTransaction(data: {
    fromUserId: string;
    toUserId: string;
    amount: string;
    type: string;
    description?: string;
  }): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(data).returning();
    return tx;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(
        sql`${transactions.fromUserId} = ${userId} OR ${transactions.toUserId} = ${userId}`,
      )
      .orderBy(desc(transactions.createdAt));
  }

  async createCommission(data: {
    userId: string;
    fromUserId: string;
    level: number;
    amount: string;
  }): Promise<Commission> {
    const [c] = await db.insert(commissions).values(data).returning();
    return c;
  }

  async getCommissionsByUserId(userId: string): Promise<Commission[]> {
    return db
      .select()
      .from(commissions)
      .where(eq(commissions.userId, userId))
      .orderBy(desc(commissions.createdAt));
  }

  async createDevice(data: {
    userId: string;
    brand: string;
    model: string;
    specs: string;
    value: string;
  }): Promise<Device> {
    const [d] = await db.insert(devices).values(data).returning();
    return d;
  }

  async getDevicesByUserId(userId: string): Promise<Device[]> {
    return db
      .select()
      .from(devices)
      .where(eq(devices.userId, userId))
      .orderBy(desc(devices.createdAt));
  }

  async getDevicesTodayCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(devices)
      .where(
        and(
          eq(devices.userId, userId),
          sql`${devices.createdAt} >= ${today}`
        )
      );
    return result[0]?.count || 0;
  }

  async getDeviceById(id: number): Promise<Device | undefined> {
    const [d] = await db.select().from(devices).where(eq(devices.id, id));
    return d;
  }

  async updateDeviceListing(
    id: number,
    isListed: boolean,
    listPrice: string | null,
  ): Promise<void> {
    await db
      .update(devices)
      .set({ isListed, listPrice })
      .where(eq(devices.id, id));
  }

  async createListing(data: {
    deviceId: number;
    sellerId: string;
    sellerName: string;
    brand: string;
    model: string;
    price: string;
  }): Promise<MarketListing> {
    const [l] = await db.insert(marketListings).values(data).returning();
    return l;
  }

  async getListings(): Promise<MarketListing[]> {
    return db
      .select()
      .from(marketListings)
      .where(eq(marketListings.isSold, false))
      .orderBy(desc(marketListings.createdAt));
  }

  async getListingById(id: number): Promise<MarketListing | undefined> {
    const [l] = await db
      .select()
      .from(marketListings)
      .where(eq(marketListings.id, id));
    return l;
  }

  async updateListingLikes(id: number, delta: number): Promise<void> {
    await db
      .update(marketListings)
      .set({
        likes: sql`${marketListings.likes} + ${delta}`,
      })
      .where(eq(marketListings.id, id));
  }

  async buyListing(id: number, buyerId: string): Promise<void> {
    await db
      .update(marketListings)
      .set({ isSold: true, buyerId })
      .where(eq(marketListings.id, id));
  }

  async createWithdrawal(data: {
    userId: string;
    amount: string;
    method: string;
    accountDetails: string;
  }): Promise<Withdrawal> {
    const [w] = await db.insert(withdrawals).values(data).returning();
    return w;
  }

  async getWithdrawalsByUserId(userId: string): Promise<Withdrawal[]> {
    return db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  async createLike(data: {
    userId: string;
    listingId: number;
  }): Promise<{ id: number }> {
    const [l] = await db.insert(likes).values(data).returning({ id: likes.id });
    return l;
  }

  async getLikeByUserAndListing(
    userId: string,
    listingId: number,
  ): Promise<{ id: number } | undefined> {
    const [l] = await db
      .select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.listingId, listingId)));
    return l;
  }

  async deleteLike(id: number): Promise<void> {
    await db.delete(likes).where(eq(likes.id, id));
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
  }): Promise<Notification> {
    const [n] = await db.insert(notifications).values(data).returning();
    return n;
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(100);
  }

  async markNotificationRead(id: number, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
