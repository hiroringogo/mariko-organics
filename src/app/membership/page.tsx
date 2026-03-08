"use client";

import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import Star from "lucide-react/dist/esm/icons/star";
import { useLanguage } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { LanguageToggle } from "@/components/language-toggle";

export default function MembershipPage() {
  const { lang } = useLanguage();

  const benefits = [
    {
      icon: CalendarCheck,
      title: t.benefit1Title[lang],
      description: t.benefit1Desc[lang],
    },
    {
      icon: Star,
      title: t.benefit2Title[lang],
      description: t.benefit2Desc[lang],
    },
    {
      icon: ShoppingBag,
      title: t.benefit3Title[lang],
      description: t.benefit3Desc[lang],
    },
    {
      icon: BookOpen,
      title: t.benefit4Title[lang],
      description: t.benefit4Desc[lang],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav Bar */}
      <header className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <Link href="/">
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <span className="text-lg font-semibold tracking-tight">
            {t.membership[lang]}
          </span>
        </div>
        <LanguageToggle />
      </header>

      <div className="flex flex-col gap-6 p-6">
        {/* Title Section */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight whitespace-pre-line">
            {t.memberTitle[lang]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.memberFee[lang]}
          </p>
        </div>

        {/* Benefits */}
        <div className="flex flex-col gap-3">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-card rounded-[16px] p-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C8F0D8] flex items-center justify-center shrink-0">
                <benefit.icon size={20} className="text-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{benefit.title}</span>
                <span className="text-xs text-muted-foreground">
                  {benefit.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 pt-2">
          <button className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold">
            {t.memberCTA[lang]}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            {t.memberFeeNote[lang]}
          </p>
        </div>
      </div>
    </div>
  );
}
