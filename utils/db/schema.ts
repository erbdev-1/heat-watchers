import {
  integer,
  varchar,
  pgTable,
  serial,
  date,
  text,
  timestamp,
  jsonb,
  boolean,
  real,
} from "drizzle-orm/pg-core";

// Define the schema for the users table

export const Users = pgTable("users", {
  id: serial("id").primaryKey(), // serial is an auto-incrementing integer in Postgres
  email: varchar("email", { length: 255 }).notNull().unique(), // 255 is the max length for email in Postgres
  name: varchar("name", { length: 255 }).notNull(), // 255 is the max length for name in Postgres
  password: varchar(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Define the schema for the reports table

export const Reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  location: text("location").notNull(),
  materialType: varchar("material_type", { length: 255 }).notNull(),
  temperature: real("temperature").notNull(), // Real tipi kullandım
  imageUrl: text("image_url"),
  weather: jsonb("weather"),
  verificationResult: jsonb("verification_result"),
  notes: text("notes"),
  status: varchar("status", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  collectorId: integer("collector_id").references(() => Users.id),
});

// Define the schema for the rewards table

export const Rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .references(() => Users.id)
    .notNull(), // references the id column in the users table
  points: integer("points").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  description: text("description"),
  name: varchar("name", { length: 255 }).notNull(),
  verifyInfo: text("verify_info").notNull(),
});

//Define the schema for the VerifyReports table

export const VerifiedReports = pgTable("verified_reports", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .references(() => Reports.id)
    .notNull(), // references the id column in the reports table
  verifierId: integer("verifier_id")
    .references(() => Users.id)
    .notNull(), // references the id column in the users table
  verificationDate: date("verification_date").notNull(),
  status: varchar("status", { length: 255 }).notNull().default("verified"),
});

//Define the schema for the Notifications table
export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(), // references the id column in the users table
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

//Define the schema for the Transactions table
export const Transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(), // references the id column in the users table
  type: varchar("type", { length: 20 }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});
