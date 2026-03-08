"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Lock from "lucide-react/dist/esm/icons/lock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useLanguage } from "@/lib/i18n";
import { t, formatDateFull, formatMonth } from "@/lib/translations";
import { LanguageToggle } from "@/components/language-toggle";
import { supabase } from "@/lib/supabase";

interface BookingData {
  lessonId: string;
  name: string;
  email: string;
  phone: string | null;
  participantCount: number;
  companions: string[];
  notes: string | null;
  lessonDate: string;
  lessonStartTime: string;
  lessonEndTime: string;
  lessonTitle: string;
  lessonPrice: number;
  totalSeats: number;
  minSeats: number;
}

export default function BookingConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`booking_${params.id}`);
    if (!stored) {
      router.replace(`/lessons/${params.id}`);
      return;
    }
    setBookingData(JSON.parse(stored));
  }, [params.id, router]);

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const totalPrice = bookingData.lessonPrice * bookingData.participantCount;
  const d = new Date(bookingData.lessonDate + "T00:00:00");
  const month = formatMonth(d.getMonth() + 1, lang);
  const day = String(d.getDate());
  const timeStr = `${bookingData.lessonStartTime.slice(0, 5)} AM - ${bookingData.lessonEndTime.slice(0, 5)} PM`;

  async function handleConfirm() {
    if (!bookingData) return;
    setSubmitting(true);

    const { error } = await supabase.from("bookings").insert({
      lesson_id: bookingData.lessonId,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      participant_count: bookingData.participantCount,
      companion_names: bookingData.companions.length > 0 ? bookingData.companions : null,
      notes: bookingData.notes,
    });

    if (!error) {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lesson_booking",
          name: bookingData.name,
          email: bookingData.email,
          lessonTitle: bookingData.lessonTitle,
          lessonDate: formatDateFull(bookingData.lessonDate, "ja"),
          lessonTime: timeStr,
          participantCount: bookingData.participantCount,
          companionNames: bookingData.companions,
          lessonPrice: bookingData.lessonPrice,
        }),
      }).catch(() => {});

      router.push(`/lessons/${params.id}/complete`);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <Link href={`/lessons/${params.id}`}>
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <span className="text-lg font-semibold tracking-tight">
            {t.confirmBooking[lang]}
          </span>
        </div>
        <LanguageToggle />
      </header>

      <div className="flex flex-col gap-5 p-6">
        {/* Booking Summary Card */}
        <div className="bg-card rounded-[16px] p-4 shadow-sm border border-border">
          {/* Date + Lesson Info */}
          <div className="flex items-center gap-4 pb-4 border-b border-border">
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

          {/* Details Grid */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.representative[lang]}</span>
              <span className="text-sm font-medium">{bookingData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.emailConfirm[lang]}</span>
              <span className="text-sm font-medium">{bookingData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.guests[lang]}</span>
              <span className="text-sm font-medium">{lang === "ja" ? `${bookingData.participantCount}名` : bookingData.participantCount}</span>
            </div>
            {bookingData.companions.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.companions[lang]}</span>
                <span className="text-sm font-medium">
                  {bookingData.companions.join(lang === "ja" ? "、" : ", ")}
                  {bookingData.participantCount > bookingData.companions.length + 1 &&
                    ` ${lang === "ja" ? "他" : "+"}${bookingData.participantCount - bookingData.companions.length - 1}${lang === "ja" ? "名" : ""}`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-card rounded-[16px] p-4 shadow-sm border border-border">
          <div className="flex justify-between pb-3 border-b border-border">
            <span className="text-sm text-muted-foreground">
              ${bookingData.lessonPrice} × {lang === "ja" ? `${bookingData.participantCount}名` : `${bookingData.participantCount} guests`}
            </span>
            <span className="text-sm font-medium">${totalPrice}</span>
          </div>
          <div className="flex justify-between pt-3">
            <span className="text-base font-semibold">{t.total[lang]}</span>
            <span className="text-xl font-bold text-primary">${totalPrice}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {t.proceedToPayment[lang]}
          </button>
          <div className="flex items-center justify-center gap-1.5">
            <Lock size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t.stripeNote[lang]}</span>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-card rounded-[16px] p-4 flex flex-col gap-2.5 border border-border">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t.cancellationTitle[lang]}</h3>
          </div>
          <ul className="flex flex-col gap-1.5">
            <li className="text-xs text-muted-foreground leading-relaxed flex gap-2">
              <span className="shrink-0">・</span>
              <span>{t.cancellationBullet1[lang]}</span>
            </li>
            <li className="text-xs text-muted-foreground leading-relaxed flex gap-2">
              <span className="shrink-0">・</span>
              <span>{t.cancellationBullet2[lang]}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
