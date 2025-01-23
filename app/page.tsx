//@ts-check
"use client";

import { ArrowRight, Leaf, Users, Coins, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import kids from "@/public/image/kids.webp";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getAllRewards,
  getRecentReports,
  getUserByEmail,
  getVerifyTasks,
} from "@/utils/db/actions";

function AnimatedGlobe() {
  return (
    <div className="relative w-36 h-36  mb-8 mx-auto">
      <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-red-400 opacity-40 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-red-300 opacity-60 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-red-200 opacity-80 animate-bounce"></div>
      <Image
        src={kids}
        alt="kids"
        className="absolute inset-0 rounded-full m-auto h-24 w-24 text-red-600 animated-pulse"
      />
    </div>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    totalReports: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0,
  });

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        // Giriş yapmış kullanıcının ID'sini dinamik olarak alın
        const userEmail = localStorage.getItem("userEmail"); // Kullanıcı email'ini localStorage'den alıyoruz
        if (!userEmail) {
          console.error("User is not logged in.");
          return;
        }

        const user = await getUserByEmail(userEmail); // Email'e göre kullanıcı bilgilerini al
        if (!user || !user.id) {
          console.error("User not found.");
          return;
        }

        const loggedInUserId = user.id; // Kullanıcının ID'sini alıyoruz

        const reports = await getRecentReports(100); // Tüm raporları getir
        const rewards = await getAllRewards(); // Tüm ödülleri getir
        const _tasks = await getVerifyTasks(100); // Tüm görevleri getir

        // Kullanıcının raporlarını filtrele
        const filteredReports = reports.filter(
          (report) => report.user_id === loggedInUserId
        );

        // Kullanıcının kazandığı ödülleri hesapla
        const tokensEarned = rewards.reduce(
          (total, reward) =>
            reward.user_id === loggedInUserId
              ? total + (reward.points || 0)
              : total,
          0
        );

        // Kullanıcının rapor sayısını ve CO2 offset miktarını hesapla
        const reportsSubmitted = filteredReports.length;
        const co2Offset = reportsSubmitted * 0.5; // 0.5 kg of CO2 offset per report

        // Durumu güncelle
        setImpactData({
          totalReports: filteredReports.length,
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10, // 1 ondalık basamak için yuvarla
        });
      } catch (error) {
        console.error("Error fetching impact data:", error);
        setImpactData({
          totalReports: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0,
        });
      }
    };

    fetchImpactData();
  }, [loggedIn]);

  const _login = () => {
    console.log("Login button clicked");
    setLoggedIn(true);
  };

  return (
    <div className="container mx-auto px-4 py-16 -mt-16">
      <section className="text-center  mb-18">
        <p className="text-2xl font-bold text-gray-900 mt-7 ">
          <span className="text-lime-500">"Don’t just be a spectator.</span>
          Take action with{" "}
          <span className="text-orange-500">HeatWatchers"</span>.
        </p>
        <div className="mt-8">
          <AnimatedGlobe />
        </div>
        <h1 className="text-6xl font-bold mb-6 text-gray-800 tracking-tight">
          Heat-Watchers
          <span className="text-green-600">Community Engagement</span>
        </h1>
        <p className="text-xl text-gray-600 max-x-2xl mx-auto leading-relaxed mb-8 ">
          HeatWatchers is not just a platform; it’s a movement. Every report
          ignites a spark of awareness. Every verification is an investment in
          the future of our planet. In this project, everyone can be a hero and
          become part of big changes through small actions.
        </p>

        {loggedIn ? (
          <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full">
            Get Started
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        ) : (
          <Link href="/report">
            <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
              Report Temperature
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        )}
      </section>

      <section className="grid grid-cols-3 gap-10 mb-20">
        <FeatureCard
          icon={Leaf}
          title="Eco-Friendly"
          description="Committed to sustainability by implementing green technologies and practices."
        />
        <FeatureCard
          icon={Coins}
          title="Earn Rewards"
          description="Earn rewards for reporting temperatures and participating in community events."
        />
        <FeatureCard
          icon={Users}
          title="Community Driven"
          description="Join a community of like-minded individuals who are passionate about the environment."
        />
      </section>
      <section className="bg-white p-10 rounded-3xl shadow-lg mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">
          Our Impact
        </h2>
        <div className="grid grid-cols-4 gap-6">
          <ImpactCard
            title="Total Reports"
            value={`${impactData.totalReports}`}
            icon={MapPin}
          />
          <ImpactCard
            title="Report Submitted"
            value={`${impactData.reportsSubmitted}`}
            icon={MapPin}
          />
          <ImpactCard
            title="Tokens Earned"
            value={Number(impactData.tokensEarned).toString()}
            icon={Coins}
          />
          <ImpactCard
            title="CO2 Offset"
            value={`${impactData.co2Offset} kg`}
            icon={Leaf}
          />
        </div>
      </section>
    </div>
  );
}

function ImpactCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) {
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("en-US", { maximumFractionDigits: 1 })
      : value;
  return (
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-md">
      <Icon className="h-10 w-10 text-green-500 mb-4" />
      <p className="text-3xl font-bold mb-2 text-gray-800">{formattedValue}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
