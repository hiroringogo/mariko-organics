"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Users from "lucide-react/dist/esm/icons/users";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Plus from "lucide-react/dist/esm/icons/plus";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Lock from "lucide-react/dist/esm/icons/lock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { supabase } from "@/lib/supabase";
import { LessonForm } from "@/components/lesson-form";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  participant_count: number;
  companion_names: string[] | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface LessonWithBookings {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  min_seats: number;
  price: number;
  workshop_title: string;
  workshop_subtitle: string;
  description: string;
  seats_remaining: number;
  bookings: Booking[];
}

type FormMode = { type: "closed" } | { type: "add" } | { type: "edit"; lesson: LessonWithBookings };

interface LessonFormData {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  min_seats: number;
  price: number;
  workshop_title: string;
  workshop_subtitle: string;
  description: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [lessons, setLessons] = useState<LessonWithBookings[]>([]);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Booking & { lessonDate: string } | null>(null);

  // Check if already logged in
  useEffect(() => {
    fetch("/api/admin-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "" }) })
      .then(() => {
        // Check cookie exists by trying to access admin data
        setAuthChecking(false);
      });
    // Simple cookie check
    if (document.cookie.includes("admin_auth=true")) {
      setAuthed(true);
    }
    setAuthChecking(false);
  }, []);

  async function handleLogin() {
    setAuthError("");
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setAuthError("パスワードが違います");
    }
  }

  const fetchData = useCallback(async () => {
    const { data: lessonData } = await supabase
      .from("lesson_with_seats")
      .select("*")
      .order("date", { ascending: true });

    if (!lessonData) return;

    const lessonsWithBookings: LessonWithBookings[] = [];
    for (const lesson of lessonData) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("lesson_id", lesson.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: true });

      lessonsWithBookings.push({ ...lesson, bookings: bookings ?? [] });
    }

    setLessons(lessonsWithBookings);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
  };

  const totalParticipants = (bookings: Booking[]) =>
    bookings.reduce((sum, b) => sum + b.participant_count, 0);

  async function handleAdd(data: LessonFormData) {
    await supabase.from("lessons").insert(data);
    setFormMode({ type: "closed" });
    await fetchData();
  }

  async function handleEdit(data: LessonFormData) {
    if (formMode.type !== "edit") return;
    await supabase.from("lessons").update(data).eq("id", formMode.lesson.id);
    setFormMode({ type: "closed" });
    await fetchData();
  }

  async function handleDelete(lessonId: string) {
    await supabase.from("lessons").delete().eq("id", lessonId);
    setConfirmDelete(null);
    setExpandedLesson(null);
    await fetchData();
  }

  async function handleCancelBooking(booking: Booking, lessonDate: string) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

    // Send cancellation email to student
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "booking_cancelled",
        name: booking.name,
        email: booking.email,
        lessonDate,
      }),
    }).catch(() => {});

    setConfirmCancel(null);
    await fetchData();
  }

  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 gap-6">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">管理者ログイン</h1>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="パスワードを入力"
            className="h-12 rounded-full bg-accent px-5 text-sm border border-input outline-none focus:border-primary transition-colors text-center"
          />
          {authError && (
            <p className="text-sm text-destructive text-center">{authError}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={!password}
            className="h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50"
          >
            ログイン
          </button>
        </div>
        <Link href="/" className="text-sm text-muted-foreground">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <Link href="/">
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <span className="text-lg font-semibold tracking-tight">管理</span>
        </div>
        {formMode.type === "closed" && (
          <button
            onClick={() => setFormMode({ type: "add" })}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full px-4 py-2"
          >
            <Plus size={16} />
            レッスン追加
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          読み込み中...
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-6">
          {/* Add / Edit Form */}
          {formMode.type === "add" && (
            <div className="bg-card rounded-[16px] p-5 shadow-sm">
              <LessonForm
                onSubmit={handleAdd}
                onCancel={() => setFormMode({ type: "closed" })}
                submitLabel="レッスンを追加"
              />
            </div>
          )}

          {formMode.type === "edit" && (
            <div className="bg-card rounded-[16px] p-5 shadow-sm">
              <LessonForm
                initial={formMode.lesson}
                onSubmit={handleEdit}
                onCancel={() => setFormMode({ type: "closed" })}
                submitLabel="レッスンを更新"
              />
            </div>
          )}

          {/* Lesson List */}
          {lessons.map((lesson) => {
            const isExpanded = expandedLesson === lesson.id;
            const participants = totalParticipants(lesson.bookings);
            const isPast = new Date(lesson.date + "T23:59:59") < new Date();

            return (
              <div key={lesson.id} className={`bg-card rounded-[16px] shadow-sm overflow-hidden ${isPast ? "opacity-50" : ""}`}>
                {/* Lesson Header */}
                <button
                  onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      <span className="text-sm font-semibold">
                        {formatDate(lesson.date)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {lesson.title}
                      </span>
                    </div>
                    {lesson.workshop_subtitle && (
                      <span className="text-xs text-muted-foreground ml-6">
                        {lesson.workshop_subtitle}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-muted-foreground" />
                      <span className={`text-sm font-medium ${
                        participants >= lesson.min_seats ? "text-primary" : "text-terracotta"
                      }`}>
                        {participants}/{lesson.total_seats}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Action Buttons */}
                    <div className="flex gap-2 p-4 pb-2">
                      <button
                        onClick={() => setFormMode({ type: "edit", lesson })}
                        className="flex items-center gap-1.5 text-sm font-medium text-primary bg-[#C8F0D8] rounded-full px-3 py-1.5"
                      >
                        <Pencil size={13} />
                        編集
                      </button>
                      {confirmDelete === lesson.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(lesson.id)}
                            className="flex items-center gap-1 text-sm font-medium text-primary-foreground bg-destructive rounded-full px-3 py-1.5"
                          >
                            本当に削除
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-sm text-muted-foreground"
                          >
                            やめる
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(lesson.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-destructive bg-secondary rounded-full px-3 py-1.5"
                        >
                          <Trash2 size={13} />
                          削除
                        </button>
                      )}
                    </div>

                    {/* Bookings */}
                    {lesson.bookings.length === 0 ? (
                      <p className="px-4 pb-4 text-sm text-muted-foreground">
                        まだ予約がありません
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
                        {lesson.bookings.map((booking) => (
                          <div key={booking.id} className="p-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {booking.name}
                                {booking.participant_count > 1 && (
                                  <span className="text-muted-foreground ml-1">
                                    +{booking.participant_count - 1}名
                                  </span>
                                )}
                              </span>
                              <button
                                onClick={() => setConfirmCancel({ ...booking, lessonDate: formatDate(lesson.date) })}
                                className="flex items-center gap-1 text-xs text-destructive"
                              >
                                <XCircle size={12} />
                                キャンセル
                              </button>
                            </div>
                            <span className="text-xs text-muted-foreground">{booking.email}</span>
                            {booking.phone && (
                              <span className="text-xs text-muted-foreground">tel: {booking.phone}</span>
                            )}
                            {booking.companion_names && booking.companion_names.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                同伴者: {booking.companion_names.join(", ")}
                              </span>
                            )}
                            {booking.notes && (
                              <span className="text-xs text-terracotta">備考: {booking.notes}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(booking.created_at).toLocaleDateString("ja-JP")} 予約
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Cancel Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 px-6">
          <div className="bg-card rounded-[20px] p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-center">予約をキャンセルしますか？</h3>
            <p className="text-sm text-muted-foreground text-center">
              {confirmCancel.name} 様（{confirmCancel.participant_count}名）の<br />
              {confirmCancel.lessonDate} の予約をキャンセルします。<br />
              <span className="text-terracotta font-medium">生徒さんにキャンセルの通知メールが届きます。</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 h-11 rounded-full bg-secondary text-foreground text-sm font-medium"
              >
                戻る
              </button>
              <button
                onClick={() => handleCancelBooking(confirmCancel, confirmCancel.lessonDate)}
                className="flex-1 h-11 rounded-full bg-destructive text-primary-foreground text-sm font-semibold"
              >
                キャンセルする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
