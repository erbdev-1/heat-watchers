import { db } from "./dbConfig";
import { Notifications, Users, Transactions } from "./schema";
import { eq, sql, and, desc } from "drizzle-orm";

// Create a new user in the database with the given email and name
export async function createUser(email: string, name: string) {
  try {
    const [user] = await db
      .insert(Users)
      .values({
        email,
        name,
      })
      .returning()
      .execute();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

// Get a user by their email address from the database

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email))
      .execute();
    return user;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

// Get all unread notifications for a given user
export async function getUnreadNotifications(userId: number) {
  try {
    return await db
      .select()
      .from(Notifications)
      .where(
        and(eq(Notifications.userId, userId), eq(Notifications.isRead, false))
      )
      .execute();
  } catch (error) {
    console.log("Error getting unread notifications:", error);
  }
}

// Get the balance for a given user by summing up all reward transactions

export async function getUserBalance(userId: number): Promise<number> {
  const transactions = await getRewardTransactions(userId);

  if (!transactions) return 0;

  const balance = transactions.reduce((acc: number, transaction: any) => {
    return transaction.type.startsWith("earned")
      ? acc + transaction.amount
      : acc - transaction.amount;
  }, 0);
  return Math.max(balance, 0);
}

// Get all reward transactions for a given user
export async function getRewardTransactions(userId: number) {
  try {
    const transactions = await db
      .select({
        id: Transactions.id,
        type: Transactions.type,
        amount: Transactions.amount,
        description: Transactions.description,
        date: Transactions.date,
      })
      .from(Transactions)
      .where(eq(Transactions.userId, userId))
      .orderBy(desc(Transactions.date))
      .limit(10)
      .execute();

    const formattedTransactions = transactions.map((t) => ({
      ...t,
      date: t.date.toISOString().split("T")[0], // Format date as YYYY-MM-DD
    }));

    return formattedTransactions;
  } catch (error) {
    console.log("Error getting reward transactions:", error);
    return null;
  }
}
