"use client";

import { useState, useEffect } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Link from "next/link";
import { LessonCard } from "@/components/lesson-card";
import { TabBar } from "@/components/tab-bar";
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
}

export default function LessonsPage() {
  const { lang } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
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

      const { data } = await query;
      setLessons(data ?? []);
      setLoaded(true);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-[84px]">
      <header className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <Link href="/">
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <span className="text-lg font-semibold tracking-tight">
            {t.lessonList[lang]}
          </span>
        </div>
        <LanguageToggle />
      </header>

      <section className="flex flex-col gap-4 px-6 pt-2">
        {loaded && lessons.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">{t.noLessons[lang]}</p>
          </div>
        ) : (
          lessons.map((lesson, i) => {
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
          })
        )}
      </section>

      <TabBar />
    </div>
  );
}
