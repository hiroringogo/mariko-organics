"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Check from "lucide-react/dist/esm/icons/check";
import { useLanguage } from "@/lib/i18n";
import { t, formatMonth } from "@/lib/translations";

interface BookingData {
  name: string;
  email: string;
  participantCount: number;
  lessonDate: string;
  lessonStartTime: string;
  lessonEndTime: string;
  lessonTitle: string;
  lessonPrice: number;
}

export default function BookingCompletePage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`booking_${params.id}`);
    if (!stored) {
      router.replace("/");
      return;
    }
    const data = JSON.parse(stored);
    setBookingData(data);
    sessionStorage.removeItem(`booking_${params.id}`);
  }, [params.id, router]);

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" />
    );
  }

  const d = new Date(bookingData.lessonDate + "T00:00:00");
  const month = formatMonth(d.getMonth() + 1, lang);
  const day = String(d.getDate());
  const timeStr = `${bookingData.lessonStartTime.slice(0, 5)} AM - ${bookingData.lessonEndTime.slice(0, 5)} PM`;
  const totalPrice = bookingData.lessonPrice * bookingData.participantCount;

  return (
    <div className="flex flex-col min-h-screen bg-background px-6 py-12">
      <div className="flex flex-col items-center gap-4 flex-1 justify-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-[#C8F0D8] flex items-center justify-center">
          <Check size={32} className="text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold tracking-tight">{t.bookingConfirmed[lang]}</h1>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground text-center whitespace-pre-line">
          {t.confirmEmailSent[lang]}
        </p>

        {/* Booking Summary Card */}
        <div className="w-full bg-card rounded-[16px] p-4 shadow-sm border border-border mt-2">
          <div className="flex items-center gap-4 pb-3 border-b border-border">
            <div className="bg-primary flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0">
              <span className="text-[11px] font-semibold text-primary-foreground">{month}</span>
              <span className="text-[22px] font-bold leading-none text-primary-foreground tracking-tight">{day}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{t.lessonTitle[lang]}</span>
              <span className="text-xs text-muted-foreground">{timeStr}</span>
              <span className="text-xs text-muted-foreground">Orange County, CA</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.guests[lang]}</span>
              <span className="text-sm font-medium">{lang === "ja" ? `${bookingData.participantCount}名` : bookingData.participantCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.amountPaid[lang]}</span>
              <span className="text-sm font-semibold text-primary">${totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3 w-full mt-4">
          <Link
            href="/"
            className="h-12 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center"
          >
            {t.backToHome[lang]}
          </Link>
          <Link
            href="/mypage"
            className="h-12 rounded-full border border-border text-foreground font-medium flex items-center justify-center"
          >
            {t.viewInMyPage[lang]}
          </Link>
        </div>
      </div>
    </div>
  );
}
