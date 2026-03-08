"use client";

import House from "lucide-react/dist/esm/icons/house";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import User from "lucide-react/dist/esm/icons/user";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { t } from "@/lib/translations";

const tabKeys = [
  { href: "/", icon: House, ja: "ホーム", en: "Home" },
  { href: "/lessons", icon: Calendar, ja: "予約", en: "Book" },
  { href: "/shop", icon: ShoppingBag, ja: "物販", en: "Shop" },
  { href: "/mypage", icon: User, ja: "マイページ", en: "My Page" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-start pt-3 pb-4 z-50"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      {tabKeys.map((tab) => {
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
              {tab[lang]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
