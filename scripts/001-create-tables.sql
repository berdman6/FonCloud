-- Create application tables for FonCloud

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "user_id" varchar(10) NOT NULL UNIQUE,
  "username" text NOT NULL UNIQUE,
  "email" text,
  "phone" varchar(20),
  "password" text NOT NULL,
  "display_name" text NOT NULL,
  "referral_code" varchar(10) NOT NULL UNIQUE,
  "referred_by" varchar(10),
  "wallet_balance" decimal(12, 2) NOT NULL DEFAULT '0.00',
  "total_earnings" decimal(12, 2) NOT NULL DEFAULT '0.00',
  "total_referrals" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" serial PRIMARY KEY,
  "from_user_id" varchar(10) NOT NULL,
  "to_user_id" varchar(10) NOT NULL,
  "amount" decimal(12, 2) NOT NULL,
  "type" varchar(30) NOT NULL,
  "description" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "commissions" (
  "id" serial PRIMARY KEY,
  "user_id" varchar(10) NOT NULL,
  "from_user_id" varchar(10) NOT NULL,
  "level" integer NOT NULL,
  "amount" decimal(12, 2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "devices" (
  "id" serial PRIMARY KEY,
  "user_id" varchar(10) NOT NULL,
  "brand" varchar(50) NOT NULL,
  "model" varchar(100) NOT NULL,
  "specs" text,
  "value" decimal(12, 2) NOT NULL,
  "is_listed" boolean NOT NULL DEFAULT false,
  "list_price" decimal(12, 2),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "market_listings" (
  "id" serial PRIMARY KEY,
  "device_id" integer NOT NULL,
  "seller_id" varchar(10) NOT NULL,
  "seller_name" text NOT NULL,
  "brand" varchar(50) NOT NULL,
  "model" varchar(100) NOT NULL,
  "price" decimal(12, 2) NOT NULL,
  "likes" integer NOT NULL DEFAULT 0,
  "is_sold" boolean NOT NULL DEFAULT false,
  "buyer_id" varchar(10),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" serial PRIMARY KEY,
  "user_id" varchar(10) NOT NULL,
  "amount" decimal(12, 2) NOT NULL,
  "method" varchar(50) NOT NULL,
  "account_details" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "likes" (
  "id" serial PRIMARY KEY,
  "user_id" varchar(10) NOT NULL,
  "listing_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "user_id" varchar(10) NOT NULL,
  "type" varchar(30) NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
