//@ts-check
"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";

import "./globals.css";

//header
//sidebar

import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getAvailableRewards, getUserByEmail } from "@/utils/db/actions";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    // Fetch total earnings from the server
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const user = await getUserByEmail(userEmail);
          if (user) {
            const availableRewards = await getAvailableRewards(user.id);
            // Toplam kazançları hesapla
            const totalPoints = availableRewards.reduce((total, reward) => {
              // Eğer 'points' özelliği varsa ekle
              if ("points" in reward && typeof reward.points === "number") {
                return total + reward.points;
              }
              return total;
            }, 0);
            setTotalEarnings(totalPoints);
          }
        }
      } catch (error) {
        console.error("Error fetching total earnings:", error);
      }
    };
    fetchTotalEarnings();
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/*HEADER */}
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            totalEarnings={totalEarnings}
          />
          <div className="flex flex-1">
            {/*SIDEBAR */}
            <Sidebar open={sidebarOpen} />
            <main className="flex-1 p-4 lg:p-8 ml:0 lg:ml-64 transition-all duration-300">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
