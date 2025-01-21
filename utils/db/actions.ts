import { db } from "./dbConfig";
import { Notifications, Users, Transactions, Reports, Rewards } from "./schema";
import { eq, sql, and, desc } from "drizzle-orm";
import axios from "axios";
import toast from "react-hot-toast";

// Create a new user in the database with the given email and name
export async function createUser(email: string, name: string) {
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      toast.error("User already exists with this email");
      return existingUser;
    }
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

    if (!user) {
      console.error("No user found with the provided email.");
      return null;
    }

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

// Get the reward transactions for a given user
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

// Mark a notification as read in the database
export async function markNotificationAsRead(notificationId: number) {
  try {
    await db
      .update(Notifications)
      .set({ isRead: true })
      .where(eq(Notifications.id, notificationId))
      .execute();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

// Create a new report in the database
export async function createReport(
  userId: number,
  location: string,
  materialType: string,
  temperature: number,
  weather: any, // Adjust the type if you have a specific schema for weather
  imageUrl?: string,
  verificationResult?: any
) {
  try {
    const [report] = await db
      .insert(Reports)
      .values({
        user_id: userId, // Corrected the field name to match database schema
        location,
        materialType,
        temperature,
        weather,

        imageUrl,
        verificationResult,
        status: "pending", // Assuming status is always "pending" when created
      })
      .returning()
      .execute();

    const pointsEarned = 10; // Assuming 10 points are earned for each report
    //UpdateRewardPoints
    await updateRewardPoints(userId, pointsEarned);
    //createTransaction
    await createTransaction(
      userId,
      "earned_report",
      pointsEarned,
      "Earned points for creating a report"
    );
    //createNotification
    await createNotification(
      userId,
      ` You have earned ${pointsEarned} points for creating a new report`,
      "reward"
    );
    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null; // Return null in case of an error
  }
}
// update reward points for a given user
export async function updateRewardPoints(userId: number, pointsToAdd: number) {
  try {
    const [updatedReward] = await db
      .update(Rewards)
      .set({
        points: sql`${Rewards.points} + ${pointsToAdd}`,
      })
      .where(eq(Rewards.user_id, userId))
      .returning()
      .execute();
    return updatedReward;
  } catch (error) {
    console.log("Error updating reward points:", error);
    return null;
  }
}

// Create a new transaction in the database
export async function createTransaction(
  userId: number,
  type: "earned_report" | "earn_collect" | "redeemed",
  amount: number,
  description: string
) {
  try {
    const [transaction] = await db
      .insert(Transactions)
      .values({
        userId,
        type,
        amount,
        description,
      })
      .returning()
      .execute();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

// Create a new notification in the database
export async function createNotification(
  userId: number,
  message: string,
  type: string
) {
  try {
    const [notification] = await db
      .insert(Notifications)
      .values({
        userId,
        message,
        type,
      })
      .returning()
      .execute();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Get the current weather for a given location

const openWeatherApiKey = process.env.NEXT_PUBLIC_OPEN_WEATHER_API_KEY;

export async function getWeather(location: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: location,
          units: "metric",
          appid: openWeatherApiKey,
        },
      }
    );
    return response.data.main.temp;
  } catch (error: any) {
    console.error(
      "Error fetching weather data:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Get the recent reports from the database
export async function getRecentReports(limit: number = 10) {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .orderBy(desc(Reports.created_at))
      .limit(limit)
      .execute();

    console.log("Fetched Reports:", reports);
    return reports;
  } catch (error) {
    console.error("Error getting recent reports:", error);
    return [];
  }
}

// Get the available rewards for a given user
export async function getAvailableRewards(userId: number) {
  try {
    const userTransactions = await getRewardTransactions(userId);
    const userPoints = userTransactions?.reduce(
      (total: any, transaction: any) => {
        return transaction.type.startsWith("earned")
          ? total + transaction.amount
          : total - transaction.amount;
      },
      0
    );

    const dbRewards = await db
      .select({
        id: Rewards.id,
        name: Rewards.name,
        points: Rewards.points,
        description: Rewards.description,
        verifyInfo: Rewards.verifyInfo,
      })
      .from(Rewards)
      .where(eq(Rewards.user_id, userId))
      .execute();

    const AllrRewards = [
      {
        id: 0,
        name: "Your Points",
        cost: userPoints,
        description: "Redeem your earned points",
        verifyInfo: "Points earned from reporting temperature",
      },
      ...dbRewards,
    ];
    return AllrRewards;
  } catch (error) {
    console.error("Error getting available rewards:", error);
    return [];
  }
}
