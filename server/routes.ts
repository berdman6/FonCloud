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
  transactions,
  withdrawals,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";

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
  return 50;
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

      const { emailOrPhone, password, referralCode } = parsed.data;
      const input = emailOrPhone.trim();

      const isEmail = input.includes('@');
      const email = isEmail ? input : null;
      const phone = !isEmail ? input : null;

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }

      if (phone) {
        const existingPhone = await storage.getUserByPhone(phone);
        if (existingPhone) {
          return res.status(400).json({ message: "Phone number already registered" });
        }
      }

      const username = input.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 12) + Math.random().toString(36).slice(2, 6);
      const displayName = isEmail ? input.split('@')[0] : input;

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
        const referrerBalance = parseFloat(referrer.walletBalance || "0");
        if (referrerBalance < SIGNUP_FEE) {
          return res.status(400).json({ message: "Referrer does not have enough balance to cover signup fee" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        displayName,
        email,
        phone,
        referredBy: referralCode === "FONCLOUD" ? null : referrer!.userId,
      });

      if (referrer) {
        await storage.updateUserBalance(referrer.userId, -SIGNUP_FEE);
        await storage.createTransaction({
          fromUserId: referrer.userId,
          toUserId: newUser.userId,
          amount: SIGNUP_FEE.toFixed(2),
          type: "signup_fee",
          description: `Signup fee for ${displayName}`,
        });
      }

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

          await storage.createNotification({
            userId: currentReferrer.userId,
            type: 'commission',
            title: 'Commission Earned!',
            message: `You earned ${commissionAmount.toFixed(2)} credits (Level ${level}) from ${displayName}'s signup.`,
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

      await storage.createNotification({
        userId: newUser.userId,
        type: 'signup',
        title: 'Welcome to FonCloud!',
        message: `Your account has been created successfully. Start manufacturing devices to earn credits!`,
      });

      if (referrer) {
        await storage.createNotification({
          userId: referrer.userId,
          type: 'referral',
          title: 'New Referral!',
          message: `${displayName} joined using your referral code.`,
        });
      }

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
      let user = await storage.getUserByUsername(username);
      if (!user && username.includes('@')) {
        user = await storage.getUserByEmail(username);
      }
      if (!user && /^\+?\d{7,}$/.test(username)) {
        user = await storage.getUserByPhone(username);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.userId;

      await storage.createNotification({
        userId: user.userId,
        type: 'login',
        title: 'Login Successful',
        message: `Welcome back, ${user.displayName}!`,
      });

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

        await storage.createNotification({
          userId: recipient.userId,
          type: 'transfer',
          title: 'Transfer Received!',
          message: `${sender.displayName} sent you ${amount.toFixed(2)} credits.`,
        });

        await storage.createNotification({
          userId: sender.userId,
          type: 'transfer',
          title: 'Transfer Sent',
          message: `You sent ${amount.toFixed(2)} credits to ${recipient.displayName}.`,
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

  // ===== DASHBOARD ROUTES =====

  app.get(
    "/api/dashboard/stats",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const txs = await storage.getTransactionsByUserId(userId);
        const comms = await storage.getCommissionsByUserId(userId);

        const now = new Date();
        const last7Days: { date: string; manufacturing: number; commission: number; total: number }[] = [];

        for (let i = 6; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(day.getDate() - i);
          const dayStr = day.toISOString().split('T')[0];
          const dayStart = new Date(dayStr + 'T00:00:00.000Z');
          const dayEnd = new Date(dayStr + 'T23:59:59.999Z');

          let mfgIncome = 0;
          let commIncome = 0;

          txs.forEach((tx: any) => {
            const txDate = new Date(tx.createdAt);
            if (txDate >= dayStart && txDate <= dayEnd) {
              if (tx.type === 'manufacturing' && tx.toUserId === userId) {
                mfgIncome += parseFloat(tx.amount || '0');
              }
            }
          });

          comms.forEach((c: any) => {
            const cDate = new Date(c.createdAt);
            if (cDate >= dayStart && cDate <= dayEnd) {
              commIncome += parseFloat(c.amount || '0');
            }
          });

          last7Days.push({
            date: dayStr,
            manufacturing: Math.round(mfgIncome * 100) / 100,
            commission: Math.round(commIncome * 100) / 100,
            total: Math.round((mfgIncome + commIncome) * 100) / 100,
          });
        }

        const totalMfg = txs
          .filter((tx: any) => tx.type === 'manufacturing' && tx.toUserId === userId)
          .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0);

        const totalComm = comms.reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0);

        return res.json({
          last7Days,
          totals: {
            manufacturing: Math.round(totalMfg * 100) / 100,
            commission: Math.round(totalComm * 100) / 100,
            total: Math.round((totalMfg + totalComm) * 100) / 100,
          },
        });
      } catch (error: any) {
        console.error("Dashboard error:", error);
        return res.status(500).json({ message: "Failed to load dashboard" });
      }
    },
  );

  // ===== ACTIVITY FEED (public dashboard) =====

  app.get(
    "/api/dashboard/activity-feed",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const allTxs = await db
          .select({
            id: transactions.id,
            fromUserId: transactions.fromUserId,
            toUserId: transactions.toUserId,
            amount: transactions.amount,
            type: transactions.type,
            description: transactions.description,
            createdAt: transactions.createdAt,
          })
          .from(transactions)
          .orderBy(desc(transactions.createdAt))
          .limit(50);

        const allWithdrawals = await db
          .select({
            id: withdrawals.id,
            userId: withdrawals.userId,
            amount: withdrawals.amount,
            method: withdrawals.method,
            status: withdrawals.status,
            createdAt: withdrawals.createdAt,
          })
          .from(withdrawals)
          .orderBy(desc(withdrawals.createdAt))
          .limit(20);

        const userIds = new Set<string>();
        allTxs.forEach(tx => { userIds.add(tx.fromUserId); userIds.add(tx.toUserId); });
        allWithdrawals.forEach(w => userIds.add(w.userId));

        const maskName = (name: string): string => {
          if (name.length <= 3) return name[0] + '***';
          const show = Math.max(2, Math.floor(name.length * 0.3));
          const front = name.slice(0, show);
          const back = name.slice(-show);
          return front + '***' + back;
        };

        const userMap: Record<string, string> = {};
        for (const uid of userIds) {
          const u = await storage.getUserByUserId(uid);
          if (u) {
            const name = u.displayName || u.username;
            userMap[uid] = maskName(name);
          }
        }

        const feed: any[] = [];

        allTxs.forEach(tx => {
          const amt = parseFloat(tx.amount || '0');
          let action = 'transfer';
          let icon = 'swap-horizontal';
          let color = '#4A90D9';

          if (tx.type === 'transfer_sent') {
            action = 'transfer';
            icon = 'swap-horizontal';
            color = '#4A90D9';
          } else if (tx.type === 'transfer_received') {
            action = 'deposit';
            icon = 'arrow-down-circle';
            color = '#5B8C3E';
          } else if (tx.type === 'manufacturing') {
            action = 'manufacturing';
            icon = 'phone-portrait';
            color = '#F5A623';
          } else if (tx.type === 'commission') {
            action = 'commission';
            icon = 'people';
            color = '#9B59B6';
          } else if (tx.type === 'device_sale') {
            action = 'sale';
            icon = 'storefront';
            color = '#E74C3C';
          } else if (tx.type === 'device_purchase') {
            action = 'purchase';
            icon = 'cart';
            color = '#3498DB';
          } else if (tx.type === 'signup_fee') {
            action = 'signup';
            icon = 'person-add';
            color = '#2ECC71';
          }

          feed.push({
            id: `tx_${tx.id}`,
            user: userMap[tx.toUserId] || tx.toUserId,
            action,
            amount: amt,
            icon,
            color,
            isPositive: ['transfer_received', 'commission', 'device_sale', 'manufacturing'].includes(tx.type),
            time: tx.createdAt,
          });
        });

        allWithdrawals.forEach(w => {
          feed.push({
            id: `wd_${w.id}`,
            user: userMap[w.userId] || w.userId,
            action: 'withdraw',
            amount: parseFloat(w.amount || '0'),
            icon: 'arrow-up-circle',
            color: '#E74C3C',
            isPositive: false,
            method: w.method,
            status: w.status,
            time: w.createdAt,
          });
        });

        feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        const FAKE_NAMES = [
          'mo***na','sa***d8','ti***ri','ha***im','ra***ul','ka***ma','sh***ab','na***en',
          'fa***id','ju***ra','ab***sh','im***an','ta***ik','su***ya','mi***ur','ar***in',
          'nu***ha','as***ul','ma***ud','ja***ir','ru***na','fi***za','ba***ar','zi***ul',
          'ka***am','di***ar','ro***na','al***in','hu***in','pa***ez','ne***ma','ta***ba',
          'af***za','mu***fi','sa***ra','ri***an','za***da','sh***la','na***im','bi***al',
          'ko***ar','ja***na','fa***ma','re***an','yu***uf','am***na','ha***ra','is***il',
          'om***ar','lu***fa','qa***ir','wa***id','da***ud','gh***am','ey***an','ch***ry',
          'bo***la','po***ma','so***ya','to***ir','go***am','mo***ir','fo***ad','lo***fi',
          'jo***ra','no***an','do***la','vo***ra','ko***fi','ho***na','wo***id','ro***ul',
          'me***ha','se***na','te***ra','de***ar','ke***ma','be***ir','fe***za','ge***ul',
          'pe***na','le***an','he***id','we***la','re***fi','ye***ma','ne***ul','ce***ra',
          'an***ri','in***ar','un***la','en***id','on***ma','ad***na','ud***ir','ed***ul',
          'za***ri','xa***na','va***id','qa***la','ta***fi','ra***ma','sa***ul','da***na',
          'ab***ir','ac***na','ag***ul','ah***id','aj***ma','ak***ri','al***na','am***ir',
          'an***ul','ap***id','ar***ma','as***ri','at***na','av***ir','aw***ul','ay***id',
          'az***ma','ba***ri','be***na','bi***ir','bu***ul','by***id','ca***ma','ci***ri',
          'cu***na','cy***ir','da***ul','de***id','di***ma','du***ri','dy***na','ea***ir',
          'el***ul','em***id','en***ma','er***ri','es***na','ev***ir','ex***ul','ey***id',
          'fa***ma','fi***ri','fu***na','fy***ir','ga***ul','gi***id','gu***ma','gy***ri',
          'ha***na','hi***ir','hu***ul','hy***id','ia***ma','il***ri','im***na','in***ir',
          'ir***ul','is***id','it***ma','iv***ri','iz***na','ja***ir','ji***ul','jo***id',
          'ju***ma','ka***ri','ki***na','ko***ir','ku***ul','la***id','li***ma','lo***ri',
          'lu***na','ma***ir','mi***ul','mu***id','my***ma','na***ri','ni***na','no***ir',
          'nu***ul','ny***id','oa***ma','ol***ri','om***na','on***ir','or***ul','os***id',
          'ot***ma','ov***ri','oz***na','pa***ir','pi***ul','po***id','pu***ma','py***ri',
          'qa***na','qi***ir','qu***ul','ra***id','ri***ma','ro***ri','ru***na','ry***ir',
          'sa***ul','si***id','so***ma','su***ri','sy***na','ta***ir','ti***ul','to***id',
          'tu***ma','ty***ri','ua***na','ul***ir','um***ul','un***id','ur***ma','us***ri',
          'ut***na','uz***ir','va***ul','vi***id','vo***ma','vu***ri','wa***na','wi***ir',
          'wu***ul','xa***id','xi***ma','xu***ri','ya***na','yi***ir','yu***ul','za***id',
          'zi***ma','zu***ri','ab***ha','ad***ra','af***na','ag***ya','ah***la','ai***ba',
          'ak***da','al***fa','am***ga','an***ha','ap***ja','aq***ka','ar***la','as***ma',
          'at***na','au***pa','av***qa','aw***ra','ax***sa','ay***ta','az***ua','ba***va',
          'bb***wa','bc***xa','bd***ya','be***za','bf***ab','bg***bb','bh***cb','bi***db',
          'bj***eb','bk***fb','bl***gb','bm***hb','bn***ib','bo***jb','bp***kb','bq***lb',
        ];

        const FAKE_ACTIONS = [
          { action: 'deposit', color: '#5B8C3E', isPositive: true },
          { action: 'withdraw', color: '#E74C3C', isPositive: false },
          { action: 'transfer', color: '#4A90D9', isPositive: false },
          { action: 'manufacturing', color: '#F5A623', isPositive: true },
          { action: 'commission', color: '#9B59B6', isPositive: true },
          { action: 'deposit', color: '#5B8C3E', isPositive: true },
          { action: 'withdraw', color: '#E74C3C', isPositive: false },
          { action: 'manufacturing', color: '#F5A623', isPositive: true },
          { action: 'sale', color: '#E74C3C', isPositive: true },
          { action: 'purchase', color: '#3498DB', isPositive: false },
          { action: 'signup', color: '#2ECC71', isPositive: false },
          { action: 'commission', color: '#9B59B6', isPositive: true },
        ];

        const now = Date.now();
        for (let i = 0; i < 300; i++) {
          const name = FAKE_NAMES[i % FAKE_NAMES.length];
          const act = FAKE_ACTIONS[Math.floor(Math.random() * FAKE_ACTIONS.length)];
          const amt = act.action === 'signup' ? 500
            : act.action === 'manufacturing' ? 50
            : +(Math.random() * 800 + 5).toFixed(2);

          feed.push({
            id: `fake_${i}`,
            user: name,
            action: act.action,
            amount: amt,
            icon: '',
            color: act.color,
            isPositive: act.isPositive,
            time: new Date(now - Math.floor(Math.random() * 86400000 * 3)),
          });
        }

        feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return res.json({ feed: feed.slice(0, 300) });
      } catch (error: any) {
        console.error("Activity feed error:", error);
        return res.status(500).json({ message: "Failed to load activity feed" });
      }
    },
  );

  // ===== MANUFACTURING ROUTES =====

  const DAILY_MANUFACTURING_LIMIT = 10;

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

        const todayCount = await storage.getDevicesTodayCount(user.userId);
        if (todayCount >= DAILY_MANUFACTURING_LIMIT) {
          return res.status(400).json({ message: "Daily manufacturing limit reached (10/day)", dailyLimitReached: true });
        }

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
      const todayCount = await storage.getDevicesTodayCount(req.session.userId!);
      return res.json({
        devices: devs.map((d) => ({
          ...d,
          value: toNum(d.value),
          listPrice: toNum(d.listPrice),
        })),
        todayCount,
        dailyLimit: DAILY_MANUFACTURING_LIMIT,
      });
    },
  );

  // ===== MARKETPLACE ROUTES =====

  app.post(
    "/api/marketplace/list",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { deviceId, price } = req.body;
        if (!deviceId) {
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

        const listPrice = price || parseFloat(device.value);
        const user = await storage.getUserByUserId(req.session.userId!);

        await storage.updateDeviceListing(
          deviceId,
          true,
          listPrice.toFixed(2),
        );

        const listing = await storage.createListing({
          deviceId,
          sellerId: user!.userId,
          sellerName: user!.displayName,
          brand: device.brand,
          model: device.model,
          price: listPrice.toFixed(2),
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
        const listingId = parseInt(req.params.id as string);
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
        const listingId = parseInt(req.params.id as string);
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

        await storage.createNotification({
          userId: user.userId,
          type: 'withdrawal',
          title: 'Withdrawal Requested',
          message: `Your withdrawal of ${amount.toFixed(2)} credits via ${method} has been submitted.`,
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

  // ===== NOTIFICATION ROUTES =====

  app.get(
    "/api/notifications",
    requireAuth,
    async (req: Request, res: Response) => {
      const list = await storage.getNotificationsByUserId(req.session.userId!);
      return res.json(list);
    },
  );

  app.get(
    "/api/notifications/unread-count",
    requireAuth,
    async (req: Request, res: Response) => {
      const count = await storage.getUnreadNotificationCount(req.session.userId!);
      return res.json({ count });
    },
  );

  app.post(
    "/api/notifications/:id/read",
    requireAuth,
    async (req: Request, res: Response) => {
      const id = parseInt(req.params.id as string);
      await storage.markNotificationRead(id, req.session.userId!);
      return res.json({ success: true });
    },
  );

  app.post(
    "/api/notifications/read-all",
    requireAuth,
    async (req: Request, res: Response) => {
      await storage.markAllNotificationsRead(req.session.userId!);
      return res.json({ success: true });
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
