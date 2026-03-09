"use client";

import { useState, useEffect } from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Link from "next/link";
import { TabBar } from "@/components/tab-bar";
import { LessonCard } from "@/components/lesson-card";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { t, formatMonth, dayNames } from "@/lib/translations";
import { LanguageToggle } from "@/components/language-toggle";

interface Lesson {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  seats_remaining: number;
  is_published: boolean;
  is_member_published: boolean;
}

export default function Home() {
  const { lang } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    async function load() {
      // Check membership
      const savedEmail = localStorage.getItem("mariko_email");
      let memberFlag = false;
      if (savedEmail) {
        try {
          const { data: member } = await supabase
            .from("members")
            .select("id")
            .eq("email", savedEmail)
            .maybeSingle();
          memberFlag = !!member;
          setIsMember(memberFlag);
        } catch {
          // members table may not exist yet
        }
      }

      // Fetch lessons: published OR (member-published if member)
      const query = supabase
        .from("lesson_with_seats")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(3);

      if (memberFlag) {
        query.or("is_published.eq.true,is_member_published.eq.true");
      } else {
        query.eq("is_published", true);
      }

      const { data } = await query;
      setLessons(data ?? []);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14">
        <span className="text-xl font-bold text-primary tracking-tight">
          Mariko Organics
        </span>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Bell size={22} className="text-muted-foreground" />
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative mx-0 h-[200px] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.jpg?v=2"
          alt={t.lessonTitle[lang]}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/80" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 pb-5 gap-1">
          <span className="text-sm font-medium text-white/80">
            {t.heroTag[lang]}
          </span>
          <p className="text-xs text-white/70">
            {t.heroSub[lang]}
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.heroTitle[lang]}
          </h1>
          <span className="text-sm text-white/85">
            {t.heroDesc[lang]}
          </span>
        </div>
      </div>

      {/* Schedule Section */}
      <section className="flex flex-col gap-4 px-6 pt-6">
        <h2 className="text-lg font-semibold tracking-tight">{t.classSchedule[lang]}</h2>

        {lessons.map((lesson, i) => {
          const d = new Date(lesson.date + "T00:00:00");
          const month = formatMonth(d.getMonth() + 1, lang);
          const day = String(d.getDate());
          const dayOfWeek = dayNames[lang][d.getDay()];
          return (
            <LessonCard
              key={lesson.id}
              id={lesson.id}
              month={month}
              day={day}
              dayOfWeek={dayOfWeek}
              title={t.lessonTitle[lang]}
              subtitle={lesson.title}
              time={`${lesson.start_time.slice(0, 5)} AM - ${lesson.end_time.slice(0, 5)} PM`}
              seatsRemaining={lesson.seats_remaining}
              totalSeats={lesson.total_seats}
              colorVariant={i % 2 === 0 ? "primary" : "terracotta"}
            />
          );
        })}

        <Link
          href="/lessons"
          className="flex items-center justify-center h-11 rounded-full border border-primary text-primary text-sm font-semibold"
        >
          {t.viewMore[lang]}
        </Link>
      </section>

      {/* Info Section */}
      <section className="flex flex-col gap-3 px-6 pt-6">
        <h2 className="text-lg font-semibold tracking-tight">{t.announcements[lang]}</h2>
        <Link href="/membership">
          <div className="flex items-center gap-3 bg-[#C8F0D8] rounded-[16px] p-4">
            <Sparkles size={20} className="text-primary shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-primary">
                {t.memberPromo[lang]}
              </span>
              <span className="text-xs text-primary">
                {t.memberPromoSub[lang]}
              </span>
            </div>
          </div>
        </Link>
      </section>

      <TabBar />
    </div>
  );
}
