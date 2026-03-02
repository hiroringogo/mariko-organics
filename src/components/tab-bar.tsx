"use client";

import House from "lucide-react/dist/esm/icons/house";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import User from "lucide-react/dist/esm/icons/user";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: House, label: "ホーム" },
  { href: "/lessons", icon: Calendar, label: "予約" },
  { href: "/shop", icon: ShoppingBag, label: "物販" },
  { href: "/mypage", icon: User, label: "マイページ" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-start pt-3 pb-4 z-50"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1"
          >
            <tab.icon
              size={22}
              className={isActive ? "text-primary" : "text-muted-foreground"}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span
              className={`text-[10px] ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground font-medium"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
