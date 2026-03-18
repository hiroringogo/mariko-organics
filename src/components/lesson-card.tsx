"use client";

import Link from "next/link";
import Users from "lucide-react/dist/esm/icons/users";
import Crown from "lucide-react/dist/esm/icons/crown";
import { useLanguage } from "@/lib/i18n";

interface LessonCardProps {
  id: string;
  month: string;
  day: string;
  dayOfWeek?: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string | null;
  time: string;
  seatsRemaining: number;
  totalSeats: number;
  colorVariant?: "primary" | "terracotta";
  isMemberOnly?: boolean;
}

export function LessonCard({
  id,
  month,
  day,
  dayOfWeek,
  title,
  imageUrl,
  time,
  seatsRemaining,
  colorVariant = "primary",
  isMemberOnly = false,
}: LessonCardProps) {
  const { lang } = useLanguage();
  const bgColor = colorVariant === "primary" ? "bg-primary" : "bg-terracotta";
  const seatColor = colorVariant === "primary" ? "text-primary" : "text-terracotta";

  const seatText = lang === "ja"
    ? `残り${seatsRemaining}席`
    : `${seatsRemaining} seats left`;

  const badgeText = lang === "ja" ? "メンバー先行予約" : "Early Access";

  return (
    <Link href={`/lessons/${id}`}>
      <div className="flex flex-col gap-2 bg-card rounded-[16px] p-4 shadow-sm">
        {isMemberOnly && (
          <div className="flex">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8B5CB8] bg-gradient-to-r from-[#F0E4FA] to-[#FAE4EF] border border-[#D4B8EC] rounded-full px-2.5 py-1 tracking-wide shadow-sm">
              <Crown size={12} className="text-[#9B6FC0]" />
              {badgeText}
            </span>
          </div>
        )}
        <div className="flex items-center gap-4">
        <div
          className={`${bgColor} flex flex-col items-center justify-center w-14 h-16 rounded-xl shrink-0`}
        >
          <span className="text-[11px] font-semibold text-primary-foreground">
            {month}
          </span>
          <span className="text-[22px] font-bold leading-none text-primary-foreground tracking-tight">
            {day}
          </span>
          {dayOfWeek && (
            <span className="text-[9px] font-medium text-primary-foreground/80">
              ({dayOfWeek})
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[15px] font-semibold text-foreground">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            <Users size={14} className={seatColor} />
            <span className={`text-[12px] font-medium ${seatColor}`}>
              {seatText}
            </span>
          </div>
          <span className="text-[13px] text-muted-foreground">{time}</span>
        </div>
        {imageUrl && (
          <div className="w-14 h-14 rounded-[10px] overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        </div>
      </div>
    </Link>
  );
}
