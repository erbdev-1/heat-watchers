import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  MapPin,
  ShieldCheck,
  Coins,
  Medal,
  Settings,
  Home,
  User,
} from "lucide-react";

const sidebarItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Report Temperature", icon: MapPin, href: "/report" },
  { label: "Verify Report", icon: ShieldCheck, href: "/verify" },
  { label: "Rewards", icon: Coins, href: "/rewards" },
  { label: "Leaderboard", icon: Medal, href: "/leaderboard" },
];

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-white border-r pt-20 border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out  ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {/* Sidebar content */}
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6  space-y-2 ">
          {sidebarItems.map((item) => (
            <Link href={item.href} key={item.href} passHref>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={`w-full justify-start py-3 ${
                  pathname === item.href
                    ? "bg-green-100 text-green-800"
                    : "text-gray-600 hover:bg-gray-100"
                }  `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span className="text-base ">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          {/* Project Contributors */}
          <div className="mb-4 px-4 py-4 border-b border-gray-500 bg-gray-50 shadow-sm rounded-md">
            <h4 className="text-lg font-bold text-gray-500 text-center">
              Project Contributors
            </h4>
            <div className="flex flex-col items-start space-y-2 mt-2">
              <div className="flex items-center w-full">
                <User className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-gray-700 text-sm font-medium">
                  Liliia Hebrin-Baidy
                </span>
              </div>
              <div className="flex items-center w-full">
                <User className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-gray-700 text-sm font-medium">
                  Sophie Weeks
                </span>
              </div>
              <div className="flex items-center w-full">
                <User className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-gray-700 text-sm font-medium">
                  Gareth Rees
                </span>
              </div>
            </div>
          </div>
          {/* Created By Section */}
          <div className="px-4 py-4 border-b border-gray-300 bg-gray-50 shadow-sm rounded-md">
            <div className="flex items-center justify-center">
              <User className="h-5 w-5  text-green-600 mr-2" />
              <span className="text-gray-800 text-sm font-medium text-center">
                Created by: Erhan Baydi
              </span>
            </div>
          </div>

          {/* Settings Section */}
          <div className="mt-3">
            <Link href="/settings" passHref>
              <Button
                variant={pathname === "/settings" ? "secondary" : "outline"}
                className={`w-full py-3 ${
                  pathname === "/settings"
                    ? "bg-green-100 text-green-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                <span className="text-base">Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}
