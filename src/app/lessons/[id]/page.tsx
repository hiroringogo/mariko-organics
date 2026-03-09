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
import ChefHat from "lucide-react/dist/esm/icons/chef-hat";
import UtensilsCrossed from "lucide-react/dist/esm/icons/utensils-crossed";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { t, formatDateFull } from "@/lib/translations";
import { LanguageToggle } from "@/components/language-toggle";

interface Lesson {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  min_seats: number;
  price: number;
  workshop_title: string;
  workshop_subtitle: string;
  seats_remaining: number;
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [participantCount, setParticipantCount] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState(["", ""]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: lessonData } = await supabase
        .from("lesson_with_seats")
        .select("*")
        .eq("id", params.id)
        .single();

      if (lessonData) {
        setLesson(lessonData);
        setSelectedLessonId(lessonData.id);
      }

      // Check membership for showing member-only lessons in date picker
      const savedEmail = localStorage.getItem("mariko_email");
      let isMember = false;
      if (savedEmail) {
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("email", savedEmail)
          .maybeSingle();
        isMember = !!member;
      }

      const query = supabase
        .from("lesson_with_seats")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (isMember) {
        query.or("is_published.eq.true,is_member_published.eq.true");
      } else {
        query.eq("is_published", true);
      }

      const { data: allData } = await query;
      if (allData) setAllLessons(allData);
    }
    fetchData();
  }, [params.id]);

  useEffect(() => {
    const savedName = localStorage.getItem("mariko_name");
    const savedEmail = localStorage.getItem("mariko_email");
    const savedPhone = localStorage.getItem("mariko_phone");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId) || lesson;
  const maxParticipants = Math.min(selectedLesson.seats_remaining, 3);

  function handleSubmit() {
    if (!name || !email) return;

    // Save booking data to sessionStorage for the confirmation page
    const bookingData = {
      lessonId: selectedLessonId,
      name,
      email,
      phone: phone || null,
      participantCount,
      companions: participantCount > 1
        ? companions.slice(0, participantCount - 1).filter(Boolean)
        : [],
      notes: notes || null,
      lessonDate: selectedLesson.date,
      lessonStartTime: selectedLesson.start_time,
      lessonEndTime: selectedLesson.end_time,
      lessonTitle: selectedLesson.workshop_subtitle,
      lessonPrice: selectedLesson.price,
      totalSeats: selectedLesson.total_seats,
      minSeats: selectedLesson.min_seats,
    };

    sessionStorage.setItem(`booking_${selectedLessonId}`, JSON.stringify(bookingData));

    localStorage.setItem("mariko_name", name);
    localStorage.setItem("mariko_email", email);
    if (phone) localStorage.setItem("mariko_phone", phone);

    router.push(`/lessons/${selectedLessonId}/confirm`);
  }

  const lessonContents = [
    {
      icon: ChefHat,
      title: t.content1Title[lang],
      subtitle: t.content1Sub[lang],
      bg: "bg-[#C8F0D8]",
      iconColor: "text-primary",
    },
    {
      icon: UtensilsCrossed,
      title: t.content2Title[lang],
      subtitle: t.content2Sub[lang],
      bg: "bg-[#FFF3E0]",
      iconColor: "text-[#D4A64A]",
    },
  ];

  const capacityText = lang === "ja"
    ? `定員 ${lesson.total_seats}名（最少催行人数 ${lesson.min_seats}名）`
    : `Max ${lesson.total_seats} guests (min. ${lesson.min_seats} to hold class)`;

  const bookButtonText = lang === "ja"
    ? `${participantCount}名で予約する`
    : `Book for ${participantCount} Guest${participantCount > 1 ? "s" : ""}`;

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
      <div className="h-[220px] bg-muted overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.jpg?v=2"
          alt={lesson.workshop_subtitle}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 p-6">
        {/* Tag + Title */}
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-1.5 bg-[#C8F0D8] text-primary text-xs font-semibold rounded-full px-3 py-1 w-fit">
            <Leaf size={14} />
            {lesson.workshop_title}
          </span>
          <h1 className="text-[26px] font-bold tracking-tight">
            {t.lessonTitle[lang]}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lesson.description}
          </p>
        </div>

        {/* Lesson Contents */}
        <div className="flex flex-col gap-3.5">
          <h2 className="text-base font-semibold">{t.lessonContentsTitle[lang]}</h2>
          {lessonContents.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`${item.bg} w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0`}>
                <item.icon size={18} className={item.iconColor} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.subtitle}</span>
              </div>
            </div>
          ))}
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

        {/* Date Selection */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{t.selectDate[lang]}</h2>
          <div className="flex flex-col gap-2">
            {allLessons.map((l) => {
              const isSelected = selectedLessonId === l.id;
              const isFull = l.seats_remaining <= 0;
              const seatsText = lang === "ja"
                ? (isFull ? "満席" : `残り${l.seats_remaining}席`)
                : (isFull ? "Full" : `${l.seats_remaining} left`);
              return (
                <button
                  key={l.id}
                  onClick={() => !isFull && setSelectedLessonId(l.id)}
                  disabled={isFull}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors ${
                    isSelected
                      ? "bg-card border-2 border-primary"
                      : isFull
                        ? "bg-secondary/50 border border-border opacity-60"
                        : "bg-card border border-border"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-sm font-semibold ${isFull ? "text-muted-foreground" : ""}`}>
                      {formatDateFull(l.date, lang)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {l.start_time.slice(0, 5)} AM
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    isFull ? "text-destructive" : l.seats_remaining <= 2 ? "text-terracotta" : "text-muted-foreground"
                  }`}>
                    {seatsText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-border" />

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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t.phoneLabel[lang]}</label>
              <span className="text-xs text-muted-foreground">{t.optional[lang]}</span>
            </div>
            <div className="flex items-center gap-2 h-10 rounded-full bg-accent px-4 border border-input">
              <span className="text-sm text-muted-foreground">+1</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567"
                className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            <span className="text-[11px] text-muted-foreground">{t.phoneHint[lang]}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{t.participantCount[lang]}</label>
            <div className="flex gap-2">
              {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => { setParticipantCount(n); if (n === 1) setCompanions(["", ""]); }}
                  className={`h-10 w-14 rounded-full text-sm font-medium transition-colors ${
                    participantCount === n ? "bg-primary text-primary-foreground" : "bg-accent border border-input text-foreground"
                  }`}>
                  {lang === "ja" ? `${n}名` : n}
                </button>
              ))}
            </div>
          </div>

          {participantCount > 1 && (
            <div className="flex flex-col gap-2.5 bg-secondary/50 border border-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <UserPlus size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">{t.companionNames[lang]}</span>
              </div>
              {Array.from({ length: participantCount - 1 }, (_, i) => i).map((i) => (
                <input key={i} type="text" value={companions[i]}
                  onChange={(e) => { const next = [...companions]; next[i] = e.target.value; setCompanions(next); }}
                  placeholder={lang === "ja" ? `${i + 1}人目のお名前` : `Companion ${i + 1} name`}
                  className="h-10 rounded-full bg-card px-3.5 text-sm border border-input outline-none focus:border-primary transition-colors" />
              ))}
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
            disabled={!name || !email}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {bookButtonText}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            {t.noRegistration[lang]}
          </p>
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
