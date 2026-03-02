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
import { supabase } from "@/lib/supabase";

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

const lessonContents = [
  {
    icon: ChefHat,
    title: "生米のサクサクサブレ作り",
    subtitle: "みんなで一緒に完成させていきましょう！",
    bg: "bg-[#C8F0D8]",
    iconColor: "text-primary",
  },
  {
    icon: UtensilsCrossed,
    title: "お楽しみランチ",
    subtitle: "季節のテーマに合わせた特別メニュー",
    bg: "bg-[#FFF3E0]",
    iconColor: "text-[#D4A64A]",
  },
];

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [participantCount, setParticipantCount] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState(["", ""]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 選択されたレッスン
      const { data: lessonData } = await supabase
        .from("lesson_with_seats")
        .select("*")
        .eq("id", params.id)
        .single();

      if (lessonData) {
        setLesson(lessonData);
        setSelectedLessonId(lessonData.id);
      }

      // 同じ月のレッスン一覧（日程選択用）
      const { data: allData } = await supabase
        .from("lesson_with_seats")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (allData) setAllLessons(allData);
    }
    fetchData();
  }, [params.id]);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId) || lesson;
  const maxParticipants = Math.min(selectedLesson.seats_remaining, 3);

  async function handleSubmit() {
    if (!name || !email) return;
    setSubmitting(true);

    const { error } = await supabase.from("bookings").insert({
      lesson_id: selectedLessonId,
      name,
      email,
      phone: phone || null,
      participant_count: participantCount,
      companion_names: participantCount > 1
        ? companions.slice(0, participantCount - 1).filter(Boolean)
        : null,
      notes: notes || null,
    });

    if (!error) {
      // Send confirmation email
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lesson_booking",
          name,
          email,
          lessonTitle: selectedLesson.workshop_subtitle,
          lessonDate: formatDate(selectedLesson.date),
          lessonTime: `${selectedLesson.start_time.slice(0, 5)} AM - ${selectedLesson.end_time.slice(0, 5)} PM`,
          participantCount,
          companionNames: participantCount > 1
            ? companions.slice(0, participantCount - 1).filter(Boolean)
            : [],
        }),
      }).catch(() => {});
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 gap-4">
        <div className="w-16 h-16 rounded-full bg-[#C8F0D8] flex items-center justify-center">
          <ChefHat size={32} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold">予約が完了しました！</h1>
        <p className="text-sm text-muted-foreground text-center">
          確認メールを {email} にお送りしました。<br />
          3日前に開催確定のご連絡をいたします。
        </p>
        <Link
          href="/"
          className="mt-4 h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center"
        >
          ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav Bar */}
      <header className="flex items-center gap-3 px-6 h-14">
        <Link href="/">
          <ChevronLeft size={24} className="text-foreground" />
        </Link>
        <span className="text-lg font-semibold tracking-tight">
          レッスン詳細
        </span>
      </header>

      {/* Hero Image */}
      <div className="h-[220px] bg-muted overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.jpg"
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
            {lesson.workshop_subtitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lesson.description}
          </p>
        </div>

        {/* Lesson Contents */}
        <div className="flex flex-col gap-3.5">
          <h2 className="text-base font-semibold">レッスン内容</h2>
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
            <span className="text-sm">{lesson.start_time.slice(0, 5)} AM - {lesson.end_time.slice(0, 5)} PM（約3時間）</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-primary" />
            <span className="text-sm">Orange County, CA（詳細は予約後にご案内）</span>
          </div>
          <div className="flex items-center gap-3">
            <Users size={18} className="text-primary" />
            <span className="text-sm">定員 {lesson.total_seats}名（最少催行人数 {lesson.min_seats}名）</span>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign size={18} className="text-primary" />
            <span className="text-sm font-medium">${lesson.price} / レッスン</span>
          </div>
        </div>

        <hr className="border-border" />

        {/* Date Selection */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">日程を選択</h2>
          <div className="flex flex-col gap-2">
            {allLessons.map((l) => {
              const isSelected = selectedLessonId === l.id;
              const isFull = l.seats_remaining <= 0;
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
                      {formatDate(l.date)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {l.start_time.slice(0, 5)} AM
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    isFull ? "text-destructive" : l.seats_remaining <= 2 ? "text-terracotta" : "text-muted-foreground"
                  }`}>
                    {isFull ? "満席" : `残り${l.seats_remaining}席`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-border" />

        {/* Booking Form */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">お客様情報</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">お名前 <span className="text-destructive">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="田中 花子"
              className="h-10 rounded-full bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">メールアドレス <span className="text-destructive">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hanako@example.com"
              className="h-10 rounded-full bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">電話番号</label>
              <span className="text-xs text-muted-foreground">任意</span>
            </div>
            <div className="flex items-center gap-2 h-10 rounded-full bg-accent px-4 border border-input">
              <span className="text-sm text-muted-foreground">+1</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567"
                className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            <span className="text-[11px] text-muted-foreground">SMSでリマインダーをお送りします</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">参加人数</label>
            <div className="flex gap-2">
              {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => { setParticipantCount(n); if (n === 1) setCompanions(["", ""]); }}
                  className={`h-10 w-14 rounded-full text-sm font-medium transition-colors ${
                    participantCount === n ? "bg-primary text-primary-foreground" : "bg-accent border border-input text-foreground"
                  }`}>
                  {n}名
                </button>
              ))}
            </div>
          </div>

          {participantCount > 1 && (
            <div className="flex flex-col gap-2.5 bg-secondary/50 border border-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <UserPlus size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">同伴者のお名前</span>
              </div>
              {Array.from({ length: participantCount - 1 }, (_, i) => i).map((i) => (
                <input key={i} type="text" value={companions[i]}
                  onChange={(e) => { const next = [...companions]; next[i] = e.target.value; setCompanions(next); }}
                  placeholder={`${i + 1}人目のお名前`}
                  className="h-10 rounded-full bg-card px-3.5 text-sm border border-input outline-none focus:border-primary transition-colors" />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">備考（アレルギーなど）</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ご自由にご記入ください" rows={3}
              className="rounded-xl bg-accent px-4 py-3 text-sm border border-input outline-none focus:border-primary transition-colors resize-none" />
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 py-1">
          <button
            onClick={handleSubmit}
            disabled={!name || !email || submitting}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {participantCount}名で予約する
          </button>
          <p className="text-xs text-muted-foreground text-center">
            ※ 会員登録不要で予約できます
          </p>
        </div>
      </div>
    </div>
  );
}
