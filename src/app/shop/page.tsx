"use client";

import { TabBar } from "@/components/tab-bar";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import { useLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";

export default function ShopPage() {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14">
        <span className="text-xl font-bold text-foreground tracking-tight">
          {lang === "ja" ? "ショップ" : "Shop"}
        </span>
        <LanguageToggle />
      </header>

      {/* Coming Soon */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-10">
        <ShoppingBag size={48} className="text-muted-foreground/40" />
        <h1 className="text-2xl font-bold tracking-tight">Coming Soon</h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          {lang === "ja"
            ? "只今準備中です。もうしばらくお待ちください。"
            : "We are preparing something special for you. Stay tuned!"}
        </p>
      </div>

      <TabBar />
    </div>
  );
}
