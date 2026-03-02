import Bell from "lucide-react/dist/esm/icons/bell";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Link from "next/link";
import { TabBar } from "@/components/tab-bar";
import { LessonCard } from "@/components/lesson-card";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

async function getLessons() {
  const { data } = await supabase
    .from("lesson_with_seats")
    .select("*")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(3);
  return data ?? [];
}

export default async function Home() {
  const lessons = await getLessons();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14">
        <span className="text-xl font-bold text-primary tracking-tight">
          Mariko Organics
        </span>
        <Bell size={22} className="text-muted-foreground" />
      </header>

      {/* Hero Section */}
      <div className="relative mx-0 h-[200px] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.jpg"
          alt="生米のサクサクサブレ"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/80" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 pb-5 gap-1">
          <span className="text-sm font-medium text-white/80">
            Gluten Free Workshop
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            3月：生米のサクサクサブレ
          </h1>
          <span className="text-sm text-white/85">
            もちもち米粉パン + ランチ付き
          </span>
        </div>
      </div>

      {/* Schedule Section */}
      <section className="flex flex-col gap-4 px-6 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">レッスン日程</h2>
          <Link
            href="/lessons"
            className="text-[13px] font-medium text-primary"
          >
            すべて見る
          </Link>
        </div>

        {lessons.map((lesson, i) => {
          const d = new Date(lesson.date + "T00:00:00");
          const month = `${d.getMonth() + 1}月`;
          const day = String(d.getDate());
          return (
            <LessonCard
              key={lesson.id}
              id={lesson.id}
              month={month}
              day={day}
              title={lesson.title}
              time={`${lesson.start_time.slice(0, 5)} AM - ${lesson.end_time.slice(0, 5)} PM`}
              seatsRemaining={lesson.seats_remaining}
              totalSeats={lesson.total_seats}
              colorVariant={i % 2 === 0 ? "primary" : "terracotta"}
            />
          );
        })}
      </section>

      {/* Info Section */}
      <section className="flex flex-col gap-3 px-6 pt-6">
        <h2 className="text-lg font-semibold tracking-tight">お知らせ</h2>
        <Link href="/membership">
          <div className="flex items-center gap-3 bg-[#C8F0D8] rounded-[16px] p-4">
            <Sparkles size={20} className="text-primary shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-primary">
                メンバーシップ先行予約受付中！
              </span>
              <span className="text-xs text-primary">
                年会費で特典いっぱい。詳しくはこちら →
              </span>
            </div>
          </div>
        </Link>
      </section>

      <TabBar />
    </div>
  );
}
