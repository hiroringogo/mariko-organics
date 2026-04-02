"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import Users from "lucide-react/dist/esm/icons/users";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Crown from "lucide-react/dist/esm/icons/crown";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import CircleCheck from "lucide-react/dist/esm/icons/circle-check";
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
  companion_names: string[] | null;
  companion_emails: string[] | null;
  companion_first_time: boolean[] | null;
  status: string;
  created_at: string;
  lesson: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    workshop_subtitle: string;
    workshop_subtitle_en?: string;
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
  const [isMember, setIsMember] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editLessonId, setEditLessonId] = useState("");
  const [editParticipantCount, setEditParticipantCount] = useState(1);
  const [availableLessons, setAvailableLessons] = useState<{ id: string; date: string; start_time: string; end_time: string; seats_remaining: number; workshop_subtitle: string; workshop_subtitle_en?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [companionSelected, setCompanionSelected] = useState<boolean[]>([]);
  const [editCompanionNames, setEditCompanionNames] = useState<string[]>([]);
  const [editCompanionEmails, setEditCompanionEmails] = useState<string[]>([]);
  const [editCompanionFirstTime, setEditCompanionFirstTime] = useState<boolean[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [memberToast, setMemberToast] = useState(false);

  const fetchBookings = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("*, lesson:lessons(*)")
      .eq("email", email)
      .eq("status", "confirmed")
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
      supabase.from("members").select("id, status").eq("email", savedEmail.toLowerCase()).maybeSingle()
        .then(({ data }) => {
          if (data && data.status === "confirmed") {
            setIsMember(true);
            // Show welcome toast only once
            const toastKey = `mariko_member_welcomed_${savedEmail}`;
            if (!localStorage.getItem(toastKey)) {
              setMemberToast(true);
              localStorage.setItem(toastKey, "true");
              setTimeout(() => setMemberToast(false), 5000);
            }
          }
        });
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
      .eq("status", "confirmed")
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
    const booking = bookings.find((b) => b.id === bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (!error) {
      // Send cancellation email
      if (booking) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "booking_cancelled",
            name: booking.name,
            email: booking.email,
            lessonDate: formatDateFull(booking.lesson.date, "ja"),
          }),
        }).catch(() => {});
      }
      // Remove cancelled booking from display
      setBookings((prev) =>
        prev.filter((b) => b.id !== bookingId)
      );
    }
    setCancelling(null);
  }

  async function handleEdit(booking: Booking) {
    setEditingBooking(booking);
    setEditLessonId(booking.lesson.id);
    setEditParticipantCount(booking.participant_count);
    // Initialize editable companion data
    const names = booking.companion_names || [];
    setCompanionSelected(names.map(() => true));
    setEditCompanionNames([...names]);
    setEditCompanionEmails([...(booking.companion_emails || names.map(() => ""))]);
    setEditCompanionFirstTime([...(booking.companion_first_time || names.map(() => false))]);

    // Fetch available lessons for the same workshop
    const { data } = await supabase
      .from("lesson_with_seats")
      .select("id, date, start_time, end_time, seats_remaining, workshop_subtitle")
      .gte("date", new Date().toISOString().split("T")[0])
      .or("is_published.eq.true,is_member_published.eq.true")
      .order("date", { ascending: true });

    if (data) setAvailableLessons(data);
  }

  async function handleSaveEdit() {
    if (!editingBooking) return;
    setSaving(true);

    // Build companion lists from selected + edited data
    const newNames: string[] = [];
    const newEmails: string[] = [];
    const newFirstTime: boolean[] = [];
    for (let i = 0; i < editCompanionNames.length; i++) {
      if (companionSelected[i] && editCompanionNames[i].trim()) {
        newNames.push(editCompanionNames[i].trim());
        newEmails.push(editCompanionEmails[i] || "");
        newFirstTime.push(editCompanionFirstTime[i] || false);
      }
    }
    const newParticipantCount = 1 + newNames.length;

    const origNames = editingBooking.companion_names || [];
    const origEmails = editingBooking.companion_emails || [];
    const origFirstTime = editingBooking.companion_first_time || [];
    const companionsChanged = newNames.length !== origNames.length ||
      newNames.some((n, i) => n !== origNames[i]) ||
      newEmails.some((e, i) => e !== (origEmails[i] || "")) ||
      newFirstTime.some((f, i) => f !== (origFirstTime[i] || false));

    const updates: Record<string, unknown> = {};
    if (editLessonId !== editingBooking.lesson.id) {
      updates.lesson_id = editLessonId;
    }
    if (newParticipantCount !== editingBooking.participant_count || companionsChanged) {
      updates.participant_count = newParticipantCount;
      updates.companion_names = newNames;
      updates.companion_emails = newEmails;
      updates.companion_first_time = newFirstTime;
    }

    if (Object.keys(updates).length === 0) {
      setEditingBooking(null);
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", editingBooking.id);

    if (!error) {
      // Send admin notification (fire and forget, no template needed)
      const selectedLesson = availableLessons.find((l) => l.id === editLessonId);
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "admin_booking_change",
          bookingName: editingBooking.name,
          lessonDate: selectedLesson ? formatDateFull(selectedLesson.date, "ja") : "",
          participantCount: newParticipantCount,
          companionNames: newNames,
        }),
      }).catch(() => {});

      await fetchBookings(userEmail);
      setEditingBooking(null);
      setSuccessMessage(lang === "ja"
        ? "予約内容を変更しました。先生にもお知らせが届きました。"
        : "Booking updated. The instructor has been notified.");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
    setSaving(false);
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
              className="h-12 rounded-full bg-cta text-cta-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold">{userName}</span>
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            {isMember && (
              <span className="inline-flex items-center gap-1 w-fit text-[11px] font-semibold text-primary bg-[#F5EBE0] rounded-full px-2 py-0.5">
                <Crown size={12} className="text-[#9B6FC0]" />
                {lang === "ja" ? "プレミアメンバー" : "Premium Member"}
              </span>
            )}
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
                        {lang === "en" && booking.lesson.workshop_subtitle_en ? booking.lesson.workshop_subtitle_en : booking.lesson.workshop_subtitle}
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
                      onClick={() => handleEdit(booking)}
                      className="flex-1 h-9 rounded-full border border-primary text-primary text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Pencil size={13} />
                      {t.edit[lang]}
                    </button>
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
                      {lang === "en" && booking.lesson.workshop_subtitle_en ? booking.lesson.workshop_subtitle_en : booking.lesson.workshop_subtitle}
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

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-background w-full max-w-[430px] rounded-t-[24px] max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <button onClick={() => setEditingBooking(null)}>
                <ChevronLeft size={24} className="text-foreground" />
              </button>
              <span className="text-lg font-semibold">{t.editBooking[lang]}</span>
              <div className="w-6" />
            </div>

            <div className="flex flex-col gap-6 p-6">
              {/* Current booking info */}
              <div className="bg-card rounded-[16px] p-4 border border-border">
                <span className="text-[15px] font-semibold">{lang === "en" && editingBooking.lesson.workshop_subtitle_en ? editingBooking.lesson.workshop_subtitle_en : editingBooking.lesson.workshop_subtitle}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar size={13} className="text-muted-foreground" />
                  <span className="text-[13px] text-muted-foreground">
                    {formatDateFull(editingBooking.lesson.date, lang)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users size={13} className="text-muted-foreground" />
                  <span className="text-[13px] text-muted-foreground">
                    {lang === "ja" ? `${editingBooking.participant_count}名` : `${editingBooking.participant_count} guest${editingBooking.participant_count > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              {/* Change Date */}
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold">{t.changeDate[lang]}</h3>
                <div className="flex flex-col gap-2">
                  {availableLessons.map((lesson) => {
                    const isSelected = editLessonId === lesson.id;
                    const isCurrent = editingBooking.lesson.id === lesson.id;
                    const seatsFree = isCurrent
                      ? lesson.seats_remaining + editingBooking.participant_count
                      : lesson.seats_remaining;
                    const isFull = seatsFree < editParticipantCount;
                    const seatsText = lang === "ja"
                      ? (isFull ? "満席" : `残り${seatsFree}席`)
                      : (isFull ? "Full" : `${seatsFree} left`);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => !isFull && setEditLessonId(lesson.id)}
                        disabled={isFull}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-card border-2 border-primary"
                            : isFull
                              ? "bg-secondary/50 border border-border opacity-60"
                              : "bg-card border border-border"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-sm font-semibold ${isFull ? "text-muted-foreground" : ""}`}>
                            {formatDateFull(lesson.date, lang)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lesson.start_time.slice(0, 5)} AM
                          </span>
                          {(lesson.workshop_subtitle || lesson.workshop_subtitle_en) && (
                            <span className="text-xs text-foreground/70 font-medium">
                              {lang === "en" && lesson.workshop_subtitle_en ? lesson.workshop_subtitle_en : lesson.workshop_subtitle}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrent && (
                            <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                              {lang === "ja" ? "現在" : "Current"}
                            </span>
                          )}
                          <span className={`text-xs font-medium ${
                            isFull ? "text-destructive" : seatsFree <= 2 ? "text-terracotta" : "text-muted-foreground"
                          }`}>
                            {seatsText}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Change Participants */}
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold">{t.changeParticipants[lang]}</h3>
                <div className="flex flex-col gap-2">
                  {/* Main booker - always attending */}
                  <div className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
                    <div className="w-5 h-5 rounded border border-primary bg-primary/10 flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className="text-sm font-medium">{editingBooking.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {lang === "ja" ? "代表者" : "Primary"}
                    </span>
                  </div>
                  {/* Companions - editable */}
                  {editCompanionNames.map((cName, i) => (
                    <div key={i} className={`flex flex-col gap-2 rounded-xl p-3 border transition-colors ${
                      companionSelected[i] ? "bg-card border-primary" : "bg-secondary/50 border-border opacity-60"
                    }`}>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...companionSelected];
                            next[i] = !next[i];
                            setCompanionSelected(next);
                          }}
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                            companionSelected[i] ? "border-primary bg-primary/10" : "border-input bg-background"
                          }`}
                        >
                          {companionSelected[i] && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </button>
                        {companionSelected[i] ? (
                          <input
                            type="text"
                            value={editCompanionNames[i]}
                            onChange={(e) => {
                              const next = [...editCompanionNames];
                              next[i] = e.target.value;
                              setEditCompanionNames(next);
                            }}
                            placeholder={lang === "ja" ? "お名前" : "Name"}
                            className="flex-1 text-sm font-medium bg-transparent outline-none border-b border-input/50 focus:border-primary pb-0.5"
                          />
                        ) : (
                          <span className="text-sm font-medium line-through text-muted-foreground">{cName}</span>
                        )}
                        {companionSelected[i] && (
                          <label className="flex items-center gap-1 shrink-0">
                            <input
                              type="checkbox"
                              checked={editCompanionFirstTime[i] || false}
                              onChange={() => {
                                const next = [...editCompanionFirstTime];
                                next[i] = !next[i];
                                setEditCompanionFirstTime(next);
                              }}
                              className="w-3.5 h-3.5 accent-primary"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {lang === "ja" ? "初参加" : "1st"}
                            </span>
                          </label>
                        )}
                      </div>
                      {companionSelected[i] && (
                        <input
                          type="email"
                          value={editCompanionEmails[i] || ""}
                          onChange={(e) => {
                            const next = [...editCompanionEmails];
                            next[i] = e.target.value;
                            setEditCompanionEmails(next);
                          }}
                          placeholder={lang === "ja" ? "メール（任意）" : "Email (optional)"}
                          className="text-xs text-muted-foreground bg-transparent outline-none border-b border-input/30 focus:border-primary pb-0.5 ml-8"
                        />
                      )}
                    </div>
                  ))}
                  {/* Add new companion button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditCompanionNames([...editCompanionNames, ""]);
                      setEditCompanionEmails([...editCompanionEmails, ""]);
                      setEditCompanionFirstTime([...editCompanionFirstTime, false]);
                      setCompanionSelected([...companionSelected, true]);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl p-3 border border-dashed border-input text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    {lang === "ja" ? "同伴者を追加" : "Add companion"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {lang === "ja"
                      ? `参加人数: ${1 + companionSelected.filter((s, i) => s && editCompanionNames[i]?.trim()).length}名`
                      : `Total: ${1 + companionSelected.filter((s, i) => s && editCompanionNames[i]?.trim()).length} guests`}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveEdit}
                disabled={saving || (() => {
                  if (editLessonId !== editingBooking.lesson.id) return false;
                  const origNames = editingBooking.companion_names || [];
                  const activeNames = editCompanionNames.filter((n, i) => companionSelected[i] && n.trim());
                  if (activeNames.length !== origNames.length) return false;
                  if (activeNames.some((n, i) => n !== origNames[i])) return false;
                  const activeEmails = editCompanionEmails.filter((_, i) => companionSelected[i] && editCompanionNames[i]?.trim());
                  const origEmails = editingBooking.companion_emails || [];
                  if (activeEmails.some((e, i) => e !== (origEmails[i] || ""))) return false;
                  const activeFirst = editCompanionFirstTime.filter((_, i) => companionSelected[i] && editCompanionNames[i]?.trim());
                  const origFirst = editingBooking.companion_first_time || [];
                  if (activeFirst.some((f, i) => f !== (origFirst[i] || false))) return false;
                  return true;
                })()}
                className="w-full h-12 rounded-full bg-cta text-cta-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {t.saveChanges[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] max-w-[380px] w-[calc(100%-32px)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 bg-card border border-primary/20 rounded-2xl p-4 shadow-lg">
            <CircleCheck size={20} className="text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Member Welcome Toast */}
      {memberToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] max-w-[380px] w-[calc(100%-48px)] animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 bg-[#1A1918] rounded-[14px] p-3.5 px-4 shadow-lg">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <CircleCheck size={16} className="text-white" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-white">{lang === "ja" ? "プレミアメンバーになりました！" : "You are now a Premium Member!"}</span>
              <span className="text-xs text-white/65">{lang === "ja" ? "Mariko Organics プレミアメンバーへようこそ" : "Welcome to Mariko Organics Premium Membership"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
