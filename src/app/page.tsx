"use client";

import { useState, useEffect, useCallback } from "react";
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
  workshop_subtitle: string;
  workshop_subtitle_en?: string;
  description: string;
  description_en?: string;
  image_url: string | null;
}

function formatTime(start: string, end: string) {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

export default function Home() {
  const { lang } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isMember, setIsMember] = useState(false);

  const loadLessons = useCallback(async () => {
    const savedEmail = localStorage.getItem("mariko_email");
    let memberFlag = false;
    if (savedEmail) {
      try {
        const { data: member } = await supabase
          .from("members")
          .select("id, status")
          .eq("email", savedEmail)
          .maybeSingle();
        memberFlag = !!member && member.status === "confirmed";
        setIsMember(memberFlag);
      } catch {
        // members table may not exist yet
      }
    }

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
  }, []);

  useEffect(() => {
    loadLessons();
    const onVisible = () => { if (document.visibilityState === "visible") loadLessons(); };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(loadLessons, 30000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [loadLessons]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center" style={{ gap: '2px' }}>
            <span className="font-[family-name:var(--font-playfair)] text-[24px] font-black tracking-[3px] text-[#B83A2A] leading-none">
              MARIKO
            </span>
            <span className="font-[family-name:var(--font-playfair)] text-[12px] font-bold tracking-[4px] text-[#B83A2A] leading-none">
              ORGANICS
            </span>
          </div>
          <span className="text-[13px] font-medium text-[#7B4B3A] tracking-wide leading-[1.3]">
            Gluten Free Workshop
          </span>
        </div>
        <LanguageToggle />
      </header>

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
              title={(lang === "en" && lesson.workshop_subtitle_en) ? lesson.workshop_subtitle_en : (lesson.workshop_subtitle || t.lessonTitle[lang])}
              imageUrl={lesson.image_url}
              time={formatTime(lesson.start_time, lesson.end_time)}
              seatsRemaining={lesson.seats_remaining}
              totalSeats={lesson.total_seats}
              colorVariant={i % 2 === 0 ? "primary" : "terracotta"}
              isMemberOnly={lesson.is_member_published && !lesson.is_published}
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
          <div className="flex items-center gap-3 bg-card rounded-[16px] p-4 border border-border shadow-[0_2px_8px_rgba(139,111,92,0.09)]">
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
