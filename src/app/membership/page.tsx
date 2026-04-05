"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import Star from "lucide-react/dist/esm/icons/star";
import Crown from "lucide-react/dist/esm/icons/crown";
import Lock from "lucide-react/dist/esm/icons/lock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { LanguageToggle } from "@/components/language-toggle";

interface Settings {
  [key: string]: string;
}

export default function MembershipPage() {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState<Settings>({});
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("site_settings").select("*");
      if (data) {
        const map: Settings = {};
        for (const row of data) map[row.key] = row.value;
        setSettings(map);
      }
      // Pre-fill from localStorage
      const savedName = localStorage.getItem("mariko_name");
      const savedEmail = localStorage.getItem("mariko_email");
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      setLoaded(true);
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!name || !email) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.code === "23505") {
        setError("このメールアドレスは既に登録済みです");
      } else {
        setError("エラーが発生しました。もう一度お試しください。");
      }
      setSubmitting(false);
      return;
    }
    // Send membership signup email
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "membership_signup",
          email: email.trim().toLowerCase(),
          name: name.trim(),
        }),
      });
    } catch {
      // Email send failure shouldn't block signup
    }
    // Notify admin about new member application
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "admin_new_member",
          email: email.trim().toLowerCase(),
          name: name.trim(),
        }),
      });
    } catch {
      // Admin notification failure shouldn't block signup
    }
    // Save to localStorage
    localStorage.setItem("mariko_name", name);
    localStorage.setItem("mariko_email", email);
    setSubmitted(true);
    setSubmitting(false);
  }

  const s = (key: string, fallback: string) => settings[key] || fallback;

  const benefitIcons = [CalendarCheck, Star, ShoppingBag, BookOpen];
  const benefits = [
    { title: s("membership_benefit_1", "先行予約・空席リクエスト"), desc: s("membership_benefit_1_desc", "レッスンの先行予約ができます") },
    { title: s("membership_benefit_2", "メンバー限定クラス"), desc: s("membership_benefit_2_desc", "限定レッスンに参加できます") },
    { title: s("membership_benefit_3", "ショップの特注・厳選配送"), desc: s("membership_benefit_3_desc", "厳選素材をお得に購入できます") },
    { title: s("membership_benefit_4", "過去レシピのオンライン閲覧"), desc: s("membership_benefit_4_desc", "過去のレシピをいつでも見返せます") },
  ];

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
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
            {t.membership[lang]}
          </span>
        </div>
        <LanguageToggle />
      </header>

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary to-[#5C4A3A] text-primary-foreground py-8 px-6">
        <Crown size={40} className="text-yellow-300" />
        <span className="text-sm font-medium tracking-wider">Mariko Organics</span>
        <span className="text-2xl font-bold">年会費：{s("membership_price", "$40")}</span>
        <span className="text-sm opacity-80">Member 募集はじめました</span>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Benefits */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">メンバー特典</h2>
          {benefits.map((benefit, i) => {
            const Icon = benefitIcons[i];
            return (
              <div key={i} className="flex items-start gap-4 bg-card rounded-[16px] p-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#F5EBE0] flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{benefit.title}</span>
                  <span className="text-xs text-muted-foreground">{benefit.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Price Card */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border-2 border-primary flex flex-col items-center gap-4">
          <span className="text-sm text-muted-foreground">年会費</span>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold">{s("membership_price", "$40")}</span>
            <span className="text-muted-foreground text-sm pb-1">/年</span>
          </div>
          <span className="text-sm text-primary font-medium">月あたりわずか {s("membership_price_monthly", "$3.3")}</span>
        </div>

        {/* Registration Form or Success */}
        {submitted ? (
          <div className="bg-card rounded-2xl p-6 text-center flex flex-col items-center gap-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#F5EBE0] flex items-center justify-center">
              <Crown size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold">お申し込みありがとうございます</h3>
            <p className="text-sm text-muted-foreground">
              確認メールをお送りしました。<br />メールをご確認ください。
            </p>
            <Link href="/" className="text-sm font-medium text-primary underline mt-2">
              ホームに戻る
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-lg font-semibold">メンバー登録</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">お名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 花子"
                className="h-11 rounded-xl bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hanako@example.com"
                className="h-11 rounded-xl bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!name || !email || submitting}
              className="h-12 rounded-full bg-cta text-cta-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              メンバーになる（年額 {s("membership_price", "$40")}）
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
