"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Users from "lucide-react/dist/esm/icons/users";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Clock from "lucide-react/dist/esm/icons/clock";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { t, formatDateFull } from "@/lib/translations";
import { LanguageToggle } from "@/components/language-toggle";

interface ExistingBooking {
  id: string;
  name: string;
  email: string;
  participant_count: number;
  companion_names: string[] | null;
  notes: string | null;
  is_first_time: boolean;
  status: string;
  created_at: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  description_en?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  min_seats: number;
  price: number;
  workshop_title: string;
  workshop_subtitle: string;
  workshop_subtitle_en?: string;
  seats_remaining: number;
  image_url: string | null;
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companions, setCompanions] = useState(["", ""]);
  const [companionEmails, setCompanionEmails] = useState(["", ""]);
  const [companionFirstTime, setCompanionFirstTime] = useState([false, false]);
  const [notes, setNotes] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [referredBy, setReferredBy] = useState("");
  const [existingBooking, setExistingBooking] = useState<ExistingBooking | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: lessonData } = await supabase
        .from("lesson_with_seats")
        .select("*")
        .eq("id", params.id)
        .single();

      if (lessonData) {
        setLesson(lessonData);
      }

      // Check if user already has a booking for this lesson
      const savedEmail = localStorage.getItem("mariko_email");
      if (savedEmail && lessonData) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("*")
          .eq("lesson_id", lessonData.id)
          .eq("email", savedEmail)
          .neq("status", "cancelled")
          .maybeSingle();
        if (booking) setExistingBooking(booking);
      }
    }
    fetchData();
  }, [params.id]);

  useEffect(() => {
    const savedName = localStorage.getItem("mariko_name");
    const savedEmail = localStorage.getItem("mariko_email");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const maxParticipants = Math.min(lesson.seats_remaining, 6);

  function handleSubmit() {
    if (!lesson || !name || !email) return;
    // Guard: block submission if lesson is fully booked
    if (lesson.seats_remaining <= 0) return;
    if (isFirstTime && !referredBy.trim()) return;
    // All companion names are required when participantCount > 1
    if (participantCount > 1) {
      const filledNames = companions.slice(0, participantCount - 1);
      if (filledNames.some((n) => !n.trim())) return;
    }

    // Save booking data to sessionStorage for the confirmation page
    const bookingData = {
      lessonId: lesson.id,
      name,
      email,
      phone: null,
      participantCount,
      companions: participantCount > 1
        ? companions.slice(0, participantCount - 1)
        : [],
      companionEmails: participantCount > 1
        ? companionEmails.slice(0, participantCount - 1)
        : [],
      companionFirstTime: participantCount > 1
        ? companionFirstTime.slice(0, participantCount - 1)
        : [],
      notes: notes || null,
      isFirstTime,
      referredBy: isFirstTime ? referredBy.trim() : null,
      lessonDate: lesson.date,
      lessonStartTime: lesson.start_time,
      lessonEndTime: lesson.end_time,
      lessonTitle: lang === "en" && lesson.workshop_subtitle_en ? lesson.workshop_subtitle_en : lesson.workshop_subtitle,
      lessonPrice: lesson.price,
      totalSeats: lesson.total_seats,
      minSeats: lesson.min_seats,
    };

    sessionStorage.setItem(`booking_${lesson.id}`, JSON.stringify(bookingData));

    localStorage.setItem("mariko_name", name);
    localStorage.setItem("mariko_email", email);

    router.push(`/lessons/${lesson.id}/confirm`);
  }

  const capacityText = lang === "ja"
    ? `定員 ${lesson.total_seats}名（最少催行人数 ${lesson.min_seats}名）`
    : `Max ${lesson.total_seats} guests (min. ${lesson.min_seats} to hold class)`;

  const bookButtonText = lang === "ja"
    ? `${participantCount}名で予約する`
    : `Book for ${participantCount} Guest${participantCount > 1 ? "s" : ""}`;

  // Simple booking confirmation view (from mypage)
  if (existingBooking) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Link href="/mypage">
              <ChevronLeft size={24} className="text-foreground" />
            </Link>
            <span className="text-lg font-semibold tracking-tight">
              {lang === "ja" ? "予約確認" : "Booking Confirmation"}
            </span>
          </div>
          <LanguageToggle />
        </header>

        <div className="flex flex-col gap-5 p-6">
          {/* Tag + Title */}
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#F5EBE0] text-primary text-xs font-semibold rounded-full px-3 py-1 w-fit">
              <Leaf size={14} />
              {lesson.workshop_title}
            </span>
            <h1 className="text-[22px] font-bold tracking-tight">
              {lang === "en" && lesson.workshop_subtitle_en ? lesson.workshop_subtitle_en : lesson.workshop_subtitle}
            </h1>
          </div>

          {/* Booked Date */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-[#FAF3ED] border-2 border-[#E8D5C4]">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-primary" />
              <span className="text-sm font-semibold">
                {formatDateFull(lesson.date, lang)}  {lesson.start_time.slice(0, 5)} AM
              </span>
            </div>
            <CheckCircle size={20} className="text-primary" />
          </div>

          {/* Confirmed Banner */}
          <div className="flex items-center gap-3 bg-[#F5EBE0] rounded-xl px-4 py-3">
            <CheckCircle size={20} className="text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary">
              {lang === "ja" ? "予約済み" : "Booking Confirmed"}
            </span>
          </div>

          {/* Booking Details Card */}
          <div className="bg-card rounded-[16px] p-5 border border-border flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <CalendarCheck size={18} className="text-primary" />
              <h2 className="text-base font-semibold">
                {lang === "ja" ? "予約詳細" : "Booking Details"}
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === "ja" ? "お名前" : "Name"}</span>
                <span className="font-medium">{existingBooking.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === "ja" ? "メール" : "Email"}</span>
                <span className="font-medium">{existingBooking.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === "ja" ? "参加人数" : "Guests"}</span>
                <span className="font-medium">{existingBooking.participant_count}{lang === "ja" ? "名" : ""}</span>
              </div>
              {existingBooking.companion_names && existingBooking.companion_names.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{lang === "ja" ? "同行者" : "Companions"}</span>
                  <span className="font-medium">{existingBooking.companion_names.join(", ")}</span>
                </div>
              )}
              {existingBooking.notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{lang === "ja" ? "備考" : "Notes"}</span>
                  <span className="font-medium">{existingBooking.notes}</span>
                </div>
              )}
              {existingBooking.is_first_time && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">{lang === "ja" ? "初参加" : "First time"}</span>
                  <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-[#DBEAFE] text-[#2563EB]">
                    {lang === "ja" ? "初参加" : "Yes"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <Link
            href="/mypage"
            className="w-full h-12 rounded-full bg-cta text-cta-foreground text-base font-semibold flex items-center justify-center"
          >
            {lang === "ja" ? "マイページに戻る" : "Back to My Page"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav Bar */}
      <header className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <Link href="/">
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <span className="text-lg font-semibold tracking-tight">
            {t.lessonDetail[lang]}
          </span>
        </div>
        <LanguageToggle />
      </header>

      {/* Hero Image */}
      {lesson.image_url && (
        <div className="h-[220px] bg-muted overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lesson.image_url}
            alt={lesson.workshop_subtitle}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-5 p-6">
        {/* Tag + Title */}
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-1.5 bg-[#F5EBE0] text-primary text-xs font-semibold rounded-full px-3 py-1 w-fit">
            <Leaf size={14} />
            {lesson.workshop_title}
          </span>
          <h1 className="text-[26px] font-bold tracking-tight">
            {lang === "en" && lesson.workshop_subtitle_en ? lesson.workshop_subtitle_en : lesson.workshop_subtitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lang === "en" && lesson.description_en ? lesson.description_en : lesson.description}
          </p>
        </div>

        <hr className="border-border" />

        {/* Info Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-primary" />
            <span className="text-sm">{lesson.start_time.slice(0, 5)} AM - {lesson.end_time.slice(0, 5)} PM {t.approxHours[lang]}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-primary" />
            <span className="text-sm">{t.locationDetail[lang]}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users size={18} className="text-primary" />
            <span className="text-sm">{capacityText}</span>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign size={18} className="text-primary" />
            <span className="text-sm font-medium">${lesson.price} {t.perLesson[lang]}</span>
          </div>
        </div>

        <hr className="border-border" />

        {/* Selected Date */}
        <div className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-[#FAF3ED] border-2 border-[#E8D5C4]">
          <div className="flex items-center gap-2">
            <CalendarCheck size={18} className="text-primary" />
            <span className="text-sm font-semibold">
              {formatDateFull(lesson.date, lang)}  {lesson.start_time.slice(0, 5)} AM
            </span>
          </div>
          <span className={`text-xs font-semibold ${
            lesson.seats_remaining <= 0
              ? "text-red-600"
              : lesson.seats_remaining <= 2
              ? "text-terracotta"
              : "text-primary"
          }`}>
            {lesson.seats_remaining <= 0
              ? (lang === "ja" ? "満席" : "Fully Booked")
              : (lang === "ja" ? `残り${lesson.seats_remaining}席` : `${lesson.seats_remaining} left`)}
          </span>
        </div>

        <hr className="border-border" />

        {lesson.seats_remaining > 0 && (
          <>
            {/* Booking Form */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">{t.customerInfo[lang]}</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{t.nameLabel[lang]} <span className="text-destructive">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder[lang]}
                  className="h-10 rounded-full bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{t.emailLabel[lang]} <span className="text-destructive">*</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder[lang]}
                  className="h-10 rounded-full bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors" />
              </div>

              {/* First-time checkbox */}
              <div className="bg-secondary/50 border border-border rounded-xl p-3 flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFirstTime}
                    onChange={(e) => setIsFirstTime(e.target.checked)}
                    className="w-5 h-5 rounded border-input accent-cta"
                  />
                  <span className="text-sm font-medium">
                    {lang === "ja" ? "初めて参加します" : "This is my first lesson"}
                  </span>
                </label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {lang === "ja"
                    ? "初めての方には事前にご自宅の住所等をメールでお伝えします"
                    : "First-time guests will receive venue details via email"}
                </p>
                {isFirstTime && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-sm font-medium">{t.referredByLabel[lang]} <span className="text-destructive">*</span></label>
                    <input type="text" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder={t.referredByPlaceholder[lang]}
                      className="h-10 rounded-full bg-card px-4 text-sm border border-input outline-none focus:border-primary transition-colors" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{t.participantCount[lang]}</label>
                <div className="flex gap-2">
                  {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => {
                      setParticipantCount(n);
                      if (n === 1) {
                        setCompanions(["", ""]);
                        setCompanionEmails(["", ""]);
                        setCompanionFirstTime([false, false]);
                      }
                    }}
                      className={`h-10 flex-1 rounded-full text-sm font-medium transition-colors ${
                        participantCount === n ? "bg-primary text-primary-foreground" : "bg-accent border border-input text-foreground"
                      }`}>
                      {lang === "ja" ? `${n}名` : n}
                    </button>
                  ))}
                </div>
              </div>

              {participantCount > 1 && (
                <div className="flex flex-col gap-3 bg-secondary/50 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <UserPlus size={14} className="text-primary" />
                    <span className="text-sm font-medium">{t.companionNames[lang]}</span>
                  </div>
                  {Array.from({ length: participantCount - 1 }, (_, i) => i).map((i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <input type="text" value={companions[i]} required
                            onChange={(e) => { const next = [...companions]; next[i] = e.target.value; setCompanions(next); }}
                            placeholder={lang === "ja" ? `お名前（必須）` : `Name (required)`}
                            className={`h-9 rounded-full bg-card px-3.5 text-sm border outline-none focus:border-primary transition-colors flex-1 ${
                              !companions[i]?.trim() ? "border-destructive/50" : "border-input"
                            }`} />
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0 ml-2">
                          <input
                            type="checkbox"
                            checked={companionFirstTime[i] || false}
                            onChange={() => {
                              const next = [...companionFirstTime];
                              next[i] = !next[i];
                              setCompanionFirstTime(next);
                            }}
                            className="w-3.5 h-3.5 rounded border-input accent-cta"
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {lang === "ja" ? "初めて参加します" : "First time"}
                          </span>
                        </label>
                      </div>
                      <input type="email" value={companionEmails[i] || ""}
                        onChange={(e) => { const next = [...companionEmails]; next[i] = e.target.value; setCompanionEmails(next); }}
                        placeholder={lang === "ja" ? "メール（任意）" : "Email (optional)"}
                        className="h-9 rounded-full bg-card px-3.5 text-xs border border-input/60 outline-none focus:border-primary transition-colors ml-7" />
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "ja"
                      ? "ご記入いただくと同伴者にも確認メールをお送りします"
                      : "Enter email to send booking confirmation to companions"}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{t.notesLabel[lang]}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder[lang]} rows={3}
                  className="rounded-xl bg-accent px-4 py-3 text-sm border border-input outline-none focus:border-primary transition-colors resize-none" />
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-2 py-1">
              <button
                onClick={handleSubmit}
                disabled={!name || !email || (isFirstTime && !referredBy.trim()) || (participantCount > 1 && companions.slice(0, participantCount - 1).some((n) => !n.trim()))}
                className="w-full h-12 rounded-full bg-cta text-cta-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bookButtonText}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                {t.noRegistration[lang]}
              </p>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
