"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import Users from "lucide-react/dist/esm/icons/users";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import { TabBar } from "@/components/tab-bar";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { t, formatDateFull, formatMonth } from "@/lib/translations";
import { LanguageToggle } from "@/components/language-toggle";

interface Booking {
  id: string;
  name: string;
  email: string;
  participant_count: number;
  status: string;
  created_at: string;
  lesson: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    workshop_subtitle: string;
    total_seats: number;
    min_seats: number;
  };
}

export default function MyPage() {
  const { lang } = useLanguage();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupDone, setLookupDone] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("*, lesson:lessons(*)")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (data) setBookings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem("mariko_name");
    const savedEmail = localStorage.getItem("mariko_email");

    if (savedName && savedEmail) {
      setUserName(savedName);
      setUserEmail(savedEmail);
      fetchBookings(savedEmail);
    } else {
      setLoading(false);
    }
  }, [fetchBookings]);

  async function handleEmailLookup() {
    if (!emailInput) return;
    setLoading(true);
    setLookupDone(false);

    const { data } = await supabase
      .from("bookings")
      .select("*, lesson:lessons(*)")
      .eq("email", emailInput)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const latestName = data[0].name;
      localStorage.setItem("mariko_name", latestName);
      localStorage.setItem("mariko_email", emailInput);
      setUserName(latestName);
      setUserEmail(emailInput);
      setBookings(data);
    } else {
      setBookings([]);
    }
    setLookupDone(true);
    setLoading(false);
  }

  async function handleCancel(bookingId: string) {
    setCancelling(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    }
    setCancelling(null);
  }

  function handleLogout() {
    localStorage.removeItem("mariko_name");
    localStorage.removeItem("mariko_email");
    localStorage.removeItem("mariko_phone");
    setUserName("");
    setUserEmail("");
    setBookings([]);
    setLookupDone(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" && b.lesson.date >= today
  );
  const pastBookings = bookings.filter(
    (b) => b.status !== "confirmed" || b.lesson.date < today
  );
  const avatar = userName ? userName.charAt(0) : "?";

  // Not logged in: email input form
  if (!userEmail) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-[84px]">
        <header className="flex items-center justify-between px-6 h-14">
          <span className="text-xl font-bold tracking-tight">{t.myPageTitle[lang]}</span>
          <LanguageToggle />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users size={32} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center whitespace-pre-line">
            {t.emailLookupPrompt[lang]}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={t.emailInputPlaceholder[lang]}
              className="h-12 rounded-full bg-accent px-5 text-sm border border-input outline-none focus:border-primary transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleEmailLookup()}
            />
            <button
              onClick={handleEmailLookup}
              disabled={!emailInput || loading}
              className="h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t.checkBookings[lang]}
            </button>
          </div>
          {lookupDone && bookings.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t.noBookingsFound[lang]}
            </p>
          )}
        </div>

        <TabBar />
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Logged in: profile + bookings
  return (
    <div className="flex flex-col min-h-screen bg-background pb-[84px]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14">
        <span className="text-xl font-bold tracking-tight">{t.myPageTitle[lang]}</span>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button onClick={handleLogout}>
            <LogOut size={20} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-6">
        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{avatar}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold">{userName}</span>
            <span className="text-sm text-muted-foreground">{userEmail}</span>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">{t.upcomingLessons[lang]}</h2>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {upcomingBookings.length}{lang === "ja" ? "件" : ""}
            </span>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="bg-card rounded-[16px] p-6 text-center">
              <p className="text-sm text-muted-foreground">{t.noUpcoming[lang]}</p>
              <Link
                href="/"
                className="text-sm font-medium text-primary mt-2 inline-block"
              >
                {t.findLessons[lang]}
              </Link>
            </div>
          ) : (
            upcomingBookings.map((booking) => {
              const d = new Date(booking.lesson.date + "T00:00:00");
              const month = formatMonth(d.getMonth() + 1, lang);
              const day = String(d.getDate());
              return (
                <div key={booking.id} className="bg-card rounded-[16px] p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0">
                      <span className="text-[11px] font-semibold text-primary-foreground">
                        {month}
                      </span>
                      <span className="text-[22px] font-bold leading-none text-primary-foreground tracking-tight">
                        {day}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-[15px] font-semibold">
                        {t.lessonTitle[lang]}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-muted-foreground" />
                        <span className="text-[13px] text-muted-foreground">
                          {formatDateFull(booking.lesson.date, lang)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-muted-foreground" />
                        <span className="text-[13px] text-muted-foreground">
                          {booking.lesson.start_time.slice(0, 5)} AM - {booking.lesson.end_time.slice(0, 5)} PM
                        </span>
                      </div>
                      {booking.participant_count > 1 && (
                        <div className="flex items-center gap-1.5">
                          <Users size={13} className="text-muted-foreground" />
                          <span className="text-[13px] text-muted-foreground">
                            {lang === "ja" ? `${booking.participant_count}名で予約` : `Booked for ${booking.participant_count}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Link
                      href={`/lessons/${booking.lesson.id}`}
                      className="flex-1 h-9 rounded-full border border-border text-sm font-medium flex items-center justify-center"
                    >
                      {t.details[lang]}
                    </Link>
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelling === booking.id}
                      className="flex-1 h-9 rounded-full border border-destructive text-destructive text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {cancelling === booking.id && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      {t.cancel[lang]}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Past Bookings / History */}
        {pastBookings.length > 0 && (
          <section className="flex flex-col gap-3 pb-6">
            <h2 className="text-lg font-semibold tracking-tight">{t.lessonHistory[lang]}</h2>
            {pastBookings.map((booking) => {
              const d = new Date(booking.lesson.date + "T00:00:00");
              const month = formatMonth(d.getMonth() + 1, lang);
              const day = String(d.getDate());
              const isCancelled = booking.status === "cancelled";
              return (
                <div
                  key={booking.id}
                  className={`flex items-center gap-4 bg-card rounded-[16px] p-4 ${isCancelled ? "opacity-50" : ""}`}
                >
                  <div className="bg-muted flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {month}
                    </span>
                    <span className="text-[18px] font-bold leading-none text-muted-foreground tracking-tight">
                      {day}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[14px] font-medium text-foreground">
                      {t.lessonTitle[lang]}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {isCancelled ? t.cancelled[lang] : booking.lesson.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>

      <TabBar />
    </div>
  );
}
