import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  registerSchema,
  loginSchema,
  transferSchema,
  withdrawalSchema,
  users,
} from "@shared/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

const SIGNUP_FEE = 500;
const COMMISSION_RATES = [
  { level: 1, rate: 0.1 },
  { level: 2, rate: 0.05 },
  { level: 3, rate: 0.02 },
  { level: 4, rate: 0.01 },
];

const APPLE_MODELS = [
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Plus",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone SE 4",
  "iPad Pro M4",
  "MacBook Pro M4",
];
const SAMSUNG_MODELS = [
  "Galaxy S25 Ultra",
  "Galaxy S25+",
  "Galaxy S25",
  "Galaxy Z Fold 6",
  "Galaxy Z Flip 6",
  "Galaxy A55",
  "Galaxy Tab S10 Ultra",
];
const FONCLOUD_MODELS = [
  "FonCloud X1 Pro",
  "FonCloud X1 Max",
  "FonCloud Lite",
  "FonCloud Ultra",
  "FonCloud Neo",
  "FonCloud Z1",
  "FonCloud Tab Pro",
];

function randomModel(brand: string): string {
  if (brand === "Apple")
    return APPLE_MODELS[Math.floor(Math.random() * APPLE_MODELS.length)];
  if (brand === "Samsung")
    return SAMSUNG_MODELS[Math.floor(Math.random() * SAMSUNG_MODELS.length)];
  return FONCLOUD_MODELS[Math.floor(Math.random() * FONCLOUD_MODELS.length)];
}

function randomSpecs(): string {
  const rams = ["4GB", "6GB", "8GB", "12GB", "16GB"];
  const storages = ["64GB", "128GB", "256GB", "512GB", "1TB"];
  const screens = ['5.5"', '6.1"', '6.5"', '6.7"', '6.9"'];
  const batteries = ["3500mAh", "4000mAh", "4500mAh", "5000mAh", "5500mAh"];
  const ram = rams[Math.floor(Math.random() * rams.length)];
  const stor = storages[Math.floor(Math.random() * storages.length)];
  const scr = screens[Math.floor(Math.random() * screens.length)];
  const bat = batteries[Math.floor(Math.random() * batteries.length)];
  return `${ram} RAM, ${stor} Storage, ${scr} Display, ${bat} Battery`;
}

function randomValue(): number {
  return Math.floor(Math.random() * 1901) + 100;
}

function toNum(val: string | null | undefined): number {
  return val ? parseFloat(val) : 0;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "foncloud-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    }),
  );

  // ===== AUTH ROUTES =====

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      const { username, password, displayName, referralCode } = parsed.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      let referrer = null;

      if (referralCode === "FONCLOUD") {
        const allUsers = await storage.getUserByReferralCode("FONCLOUD");
        if (allUsers) {
          return res.status(400).json({ message: "Seed referral code already used" });
        }
      } else {
        referrer = await storage.getUserByReferralCode(referralCode);
        if (!referrer) {
          return res.status(400).json({ message: "Invalid referral code" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        displayName,
        referredBy: referralCode === "FONCLOUD" ? null : referrer!.userId,
      });

      await storage.updateUserBalance(newUser.userId, -SIGNUP_FEE);

      if (referrer) {
        await storage.incrementReferralCount(referrer.userId);

        let currentReferrer = referrer;
        for (const { level, rate } of COMMISSION_RATES) {
          if (!currentReferrer) break;

          const commissionAmount = SIGNUP_FEE * rate;
          await storage.updateUserBalance(
            currentReferrer.userId,
            commissionAmount,
          );
          await storage.createCommission({
            userId: currentReferrer.userId,
            fromUserId: newUser.userId,
            level,
            amount: commissionAmount.toFixed(2),
          });
          await storage.createTransaction({
            fromUserId: newUser.userId,
            toUserId: currentReferrer.userId,
            amount: commissionAmount.toFixed(2),
            type: "commission",
            description: `Level ${level} referral commission`,
          });

          if (currentReferrer.referredBy) {
            const nextReferrer = await storage.getUserByUserId(
              currentReferrer.referredBy,
            );
            currentReferrer = nextReferrer!;
          } else {
            break;
          }
        }
      }

      req.session.userId = newUser.userId;

      const freshUser = await storage.getUserByUserId(newUser.userId);
      return res.json({
        user: {
          ...freshUser,
          walletBalance: toNum(freshUser!.walletBalance),
          totalEarnings: toNum(freshUser!.totalEarnings),
          password: undefined,
        },
      });
    } catch (error: any) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { username, password } = parsed.data;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.userId;

      return res.json({
        user: {
          ...user,
          walletBalance: toNum(user.walletBalance),
          totalEarnings: toNum(user.totalEarnings),
          password: undefined,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUserByUserId(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.json({
      user: {
        ...user,
        walletBalance: toNum(user.walletBalance),
        totalEarnings: toNum(user.totalEarnings),
        password: undefined,
      },
    });
  });

  // ===== WALLET ROUTES =====

  app.get(
    "/api/wallet/balance",
    requireAuth,
    async (req: Request, res: Response) => {
      const user = await storage.getUserByUserId(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json({
        walletBalance: toNum(user.walletBalance),
        totalEarnings: toNum(user.totalEarnings),
      });
    },
  );

  app.post(
    "/api/wallet/transfer",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = transferSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid input" });
        }

        const { toUserId, amount } = parsed.data;
        const sender = await storage.getUserByUserId(req.session.userId!);
        if (!sender) return res.status(404).json({ message: "Sender not found" });

        if (sender.userId === toUserId) {
          return res.status(400).json({ message: "Cannot transfer to yourself" });
        }

        const recipient = await storage.getUserByUserId(toUserId);
        if (!recipient) {
          return res.status(404).json({ message: "Recipient not found" });
        }

        if (toNum(sender.walletBalance) < amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }

        await storage.updateUserBalance(sender.userId, -amount);
        await storage.updateUserBalance(recipient.userId, amount);

        await storage.createTransaction({
          fromUserId: sender.userId,
          toUserId: recipient.userId,
          amount: amount.toFixed(2),
          type: "transfer",
          description: `Transfer to ${recipient.displayName}`,
        });

        const updatedSender = await storage.getUserByUserId(sender.userId);
        return res.json({
          message: "Transfer successful",
          walletBalance: toNum(updatedSender!.walletBalance),
        });
      } catch (error: any) {
        console.error("Transfer error:", error);
        return res.status(500).json({ message: "Transfer failed" });
      }
    },
  );

  app.get(
    "/api/wallet/transactions",
    requireAuth,
    async (req: Request, res: Response) => {
      const txs = await storage.getTransactionsByUserId(req.session.userId!);
      return res.json(
        txs.map((tx) => ({
          ...tx,
          amount: toNum(tx.amount),
        })),
      );
    },
  );

  // ===== MANUFACTURING ROUTES =====

  app.post(
    "/api/manufacturing/generate",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { brand } = req.body;
        if (!["Apple", "Samsung", "FonCloud Special"].includes(brand)) {
          return res.status(400).json({ message: "Invalid brand" });
        }

        const user = await storage.getUserByUserId(req.session.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });

        const model = randomModel(brand);
        const specs = randomSpecs();
        const value = randomValue();

        const device = await storage.createDevice({
          userId: user.userId,
          brand,
          model,
          specs,
          value: value.toFixed(2),
        });

        await storage.updateUserBalance(user.userId, value);

        await storage.createTransaction({
          fromUserId: "SYSTEM",
          toUserId: user.userId,
          amount: value.toFixed(2),
          type: "manufacturing",
          description: `Manufactured ${brand} ${model}`,
        });

        return res.json({
          device: {
            ...device,
            value: toNum(device.value),
            listPrice: toNum(device.listPrice),
          },
        });
      } catch (error: any) {
        console.error("Manufacturing error:", error);
        return res.status(500).json({ message: "Manufacturing failed" });
      }
    },
  );

  app.get(
    "/api/manufacturing/devices",
    requireAuth,
    async (req: Request, res: Response) => {
      const devs = await storage.getDevicesByUserId(req.session.userId!);
      return res.json(
        devs.map((d) => ({
          ...d,
          value: toNum(d.value),
          listPrice: toNum(d.listPrice),
        })),
      );
    },
  );

  // ===== MARKETPLACE ROUTES =====

  app.post(
    "/api/marketplace/list",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { deviceId, price } = req.body;
        if (!deviceId || !price || price <= 0) {
          return res.status(400).json({ message: "Invalid input" });
        }

        const device = await storage.getDeviceById(deviceId);
        if (!device) {
          return res.status(404).json({ message: "Device not found" });
        }
        if (device.userId !== req.session.userId) {
          return res.status(403).json({ message: "Not your device" });
        }
        if (device.isListed) {
          return res.status(400).json({ message: "Device already listed" });
        }

        const user = await storage.getUserByUserId(req.session.userId!);

        await storage.updateDeviceListing(
          deviceId,
          true,
          price.toFixed(2),
        );

        const listing = await storage.createListing({
          deviceId,
          sellerId: user!.userId,
          sellerName: user!.displayName,
          brand: device.brand,
          model: device.model,
          price: price.toFixed(2),
        });

        return res.json({
          listing: {
            ...listing,
            price: toNum(listing.price),
          },
        });
      } catch (error: any) {
        console.error("List error:", error);
        return res.status(500).json({ message: "Listing failed" });
      }
    },
  );

  app.get(
    "/api/marketplace/feed",
    requireAuth,
    async (req: Request, res: Response) => {
      const listings = await storage.getListings();
      return res.json(
        listings.map((l) => ({
          ...l,
          price: toNum(l.price),
        })),
      );
    },
  );

  app.post(
    "/api/marketplace/like/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const listingId = parseInt(req.params.id);
        const listing = await storage.getListingById(listingId);
        if (!listing) {
          return res.status(404).json({ message: "Listing not found" });
        }

        const existingLike = await storage.getLikeByUserAndListing(
          req.session.userId!,
          listingId,
        );

        if (existingLike) {
          await storage.deleteLike(existingLike.id);
          await storage.updateListingLikes(listingId, -1);
          return res.json({ liked: false, likes: listing.likes - 1 });
        } else {
          await storage.createLike({
            userId: req.session.userId!,
            listingId,
          });
          await storage.updateListingLikes(listingId, 1);
          return res.json({ liked: true, likes: listing.likes + 1 });
        }
      } catch (error: any) {
        console.error("Like error:", error);
        return res.status(500).json({ message: "Like failed" });
      }
    },
  );

  app.post(
    "/api/marketplace/buy/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const listingId = parseInt(req.params.id);
        const listing = await storage.getListingById(listingId);
        if (!listing) {
          return res.status(404).json({ message: "Listing not found" });
        }
        if (listing.isSold) {
          return res.status(400).json({ message: "Already sold" });
        }
        if (listing.sellerId === req.session.userId) {
          return res
            .status(400)
            .json({ message: "Cannot buy your own listing" });
        }

        const buyer = await storage.getUserByUserId(req.session.userId!);
        if (!buyer)
          return res.status(404).json({ message: "Buyer not found" });

        const price = toNum(listing.price);
        if (toNum(buyer.walletBalance) < price) {
          return res.status(400).json({ message: "Insufficient balance" });
        }

        await storage.updateUserBalance(buyer.userId, -price);
        await storage.updateUserBalance(listing.sellerId, price);
        await storage.buyListing(listingId, buyer.userId);

        await storage.createTransaction({
          fromUserId: buyer.userId,
          toUserId: listing.sellerId,
          amount: price.toFixed(2),
          type: "marketplace_purchase",
          description: `Purchased ${listing.brand} ${listing.model}`,
        });

        return res.json({ message: "Purchase successful" });
      } catch (error: any) {
        console.error("Buy error:", error);
        return res.status(500).json({ message: "Purchase failed" });
      }
    },
  );

  // ===== WITHDRAWAL ROUTES =====

  app.post(
    "/api/withdrawals/create",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = withdrawalSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid input" });
        }

        const { amount, method, accountDetails } = parsed.data;
        const user = await storage.getUserByUserId(req.session.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (toNum(user.walletBalance) < amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }

        await storage.updateUserBalance(user.userId, -amount);

        const withdrawal = await storage.createWithdrawal({
          userId: user.userId,
          amount: amount.toFixed(2),
          method,
          accountDetails,
        });

        await storage.createTransaction({
          fromUserId: user.userId,
          toUserId: "WITHDRAWAL",
          amount: amount.toFixed(2),
          type: "withdrawal",
          description: `Withdrawal via ${method}`,
        });

        return res.json({
          withdrawal: {
            ...withdrawal,
            amount: toNum(withdrawal.amount),
          },
        });
      } catch (error: any) {
        console.error("Withdrawal error:", error);
        return res.status(500).json({ message: "Withdrawal failed" });
      }
    },
  );

  app.get(
    "/api/withdrawals/history",
    requireAuth,
    async (req: Request, res: Response) => {
      const list = await storage.getWithdrawalsByUserId(req.session.userId!);
      return res.json(
        list.map((w) => ({
          ...w,
          amount: toNum(w.amount),
        })),
      );
    },
  );

  // ===== REFERRAL ROUTES =====

  app.get(
    "/api/referrals/network",
    requireAuth,
    async (req: Request, res: Response) => {
      const user = await storage.getUserByUserId(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { db } = await import("./db");

      const referrals = await db
        .select({
          userId: users.userId,
          displayName: users.displayName,
          username: users.username,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.referredBy, user.userId));

      return res.json({
        referralCode: user.referralCode,
        totalReferrals: user.totalReferrals,
        referrals,
      });
    },
  );

  app.get(
    "/api/referrals/commissions",
    requireAuth,
    async (req: Request, res: Response) => {
      const list = await storage.getCommissionsByUserId(req.session.userId!);
      return res.json(
        list.map((c) => ({
          ...c,
          amount: toNum(c.amount),
        })),
      );
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
