"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Users from "lucide-react/dist/esm/icons/users";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Plus from "lucide-react/dist/esm/icons/plus";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Download from "lucide-react/dist/esm/icons/download";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Lock from "lucide-react/dist/esm/icons/lock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
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
  payment_status: string;
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
  is_published: boolean;
  is_member_published: boolean;
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
  is_published?: boolean;
  is_member_published?: boolean;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [allLessons, setAllLessons] = useState<LessonWithBookings[]>([]);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Booking & { lessonDate: string } | null>(null);
  const [members, setMembers] = useState<{ id: string; email: string; name: string | null; created_at: string }[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [memberError, setMemberError] = useState("");

  // Month filter
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
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

  function handleLogout() {
    document.cookie = "admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setAuthed(false);
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

    setAllLessons(lessonsWithBookings);
    setLoading(false);
  }, []);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });
    setMembers(data ?? []);
  }, []);

  async function handleAddMember() {
    setMemberError("");
    if (!newMemberEmail) return;
    const { error } = await supabase.from("members").insert({
      email: newMemberEmail.trim().toLowerCase(),
      name: newMemberName.trim() || null,
    });
    if (error) {
      setMemberError(error.code === "23505" ? "このメールは既に登録済みです" : "エラーが発生しました");
      return;
    }
    setNewMemberEmail("");
    setNewMemberName("");
    await fetchMembers();
  }

  async function handleRemoveMember(id: string) {
    await supabase.from("members").delete().eq("id", id);
    await fetchMembers();
  }

  useEffect(() => { if (authed) { fetchData(); fetchMembers(); } }, [authed, fetchData, fetchMembers]);

  // Filter lessons by selected month
  const lessons = useMemo(() =>
    allLessons.filter((l) => l.date.startsWith(selectedMonth)),
    [allLessons, selectedMonth]
  );

  // Metrics
  const totalLessons = lessons.length;
  const totalBookings = lessons.reduce((sum, l) => sum + l.bookings.reduce((s, b) => s + b.participant_count, 0), 0);
  const totalSeats = lessons.reduce((sum, l) => sum + l.total_seats, 0);
  const occupancyRate = totalSeats > 0 ? Math.round((totalBookings / totalSeats) * 100) : 0;

  // Group lessons by date
  const groupedLessons = useMemo(() => {
    const groups: { date: string; lessons: LessonWithBookings[] }[] = [];
    for (const lesson of lessons) {
      const existing = groups.find((g) => g.date === lesson.date);
      if (existing) {
        existing.lessons.push(lesson);
      } else {
        groups.push({ date: lesson.date, lessons: [lesson] });
      }
    }
    return groups;
  }, [lessons]);

  // Month navigation
  const [selectedYear, selectedMonthNum] = selectedMonth.split("-").map(Number);
  const monthLabel = `${selectedYear}年${selectedMonthNum}月`;

  function prevMonth() {
    const d = new Date(selectedYear, selectedMonthNum - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function nextMonth() {
    const d = new Date(selectedYear, selectedMonthNum, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
  };

  const formatDateShort = (dateStr: string) => {
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

  async function handleAddMultiple(dataList: LessonFormData[]) {
    await supabase.from("lessons").insert(dataList);
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
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "booking_cancelled", name: booking.name, email: booking.email, lessonDate }),
    }).catch(() => {});
    setConfirmCancel(null);
    await fetchData();
  }

  async function handleTogglePublish(lessonId: string, field: "is_published" | "is_member_published", current: boolean) {
    const update: Record<string, boolean> = { [field]: !current };
    // 一般公開ON → 会員公開も自動ON
    if (field === "is_published" && !current) {
      update.is_member_published = true;
    }
    await supabase.from("lessons").update(update).eq("id", lessonId);
    await fetchData();
  }

  const paymentCycle: Record<string, string> = { unpaid: "paid", paid: "refunded", refunded: "unpaid" };
  const paymentLabel: Record<string, string> = { unpaid: "未払い", paid: "支払済", refunded: "返金済" };
  const paymentColor: Record<string, string> = {
    unpaid: "bg-[#FFF3E0] text-[#D4A64A]",
    paid: "bg-[#C8F0D8] text-primary",
    refunded: "bg-secondary text-muted-foreground",
  };

  async function handleTogglePayment(bookingId: string, current: string) {
    const next = paymentCycle[current] ?? "unpaid";
    await supabase.from("bookings").update({ payment_status: next }).eq("id", bookingId);
    await fetchData();
  }

  // CSV Export
  function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportBookings() {
    const headers = ["日付", "レッスン", "名前", "メール", "電話", "人数", "同伴者", "備考", "支払い", "予約日"];
    const rows = allLessons.flatMap((l) =>
      l.bookings.map((b) => [
        l.date, l.workshop_subtitle || l.title, b.name, b.email, b.phone ?? "",
        String(b.participant_count), (b.companion_names ?? []).join(" / "), b.notes ?? "",
        paymentLabel[b.payment_status] ?? "未払い",
        new Date(b.created_at).toLocaleDateString("ja-JP"),
      ])
    );
    downloadCSV(`予約一覧_${selectedMonth}.csv`, headers, rows);
  }

  function exportStudents() {
    const seen = new Set<string>();
    const headers = ["名前", "メール", "電話", "予約回数", "総人数"];
    const studentMap: Record<string, { name: string; email: string; phone: string; count: number; total: number }> = {};
    for (const l of allLessons) {
      for (const b of l.bookings) {
        if (!studentMap[b.email]) {
          studentMap[b.email] = { name: b.name, email: b.email, phone: b.phone ?? "", count: 0, total: 0 };
        }
        studentMap[b.email].count++;
        studentMap[b.email].total += b.participant_count;
        if (b.phone && !studentMap[b.email].phone) studentMap[b.email].phone = b.phone;
      }
    }
    const rows = Object.values(studentMap).map((s) => [s.name, s.email, s.phone, String(s.count), String(s.total)]);
    downloadCSV(`生徒一覧.csv`, headers, rows);
  }

  // Avatar color based on first char
  const avatarColors = ["#D89575", "#3D8A5A", "#D4A64A", "#5B9BD5", "#9C7BB5", "#D08068"];
  function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }

  // Publish status label
  function publishLabel(lesson: LessonWithBookings) {
    if (lesson.is_published) return { text: "一般公開", color: "bg-[#C8F0D8] text-primary" };
    if (lesson.is_member_published) return { text: "会員限定", color: "bg-[#E8D5F5] text-[#7B5EA7]" };
    return { text: "下書き", color: "bg-secondary text-muted-foreground" };
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
          {authError && <p className="text-sm text-destructive text-center">{authError}</p>}
          <button onClick={handleLogin} disabled={!password}
            className="h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50">
            ログイン
          </button>
        </div>
        <Link href="/" className="text-sm text-muted-foreground">← ホームに戻る</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14">
        <h1 className="text-lg font-bold tracking-tight">管理者ダッシュボード</h1>
        <div className="flex items-center gap-3">
          {formMode.type === "closed" && (
            <button
              onClick={() => setFormMode({ type: "add" })}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full px-3 py-1.5"
            >
              <Plus size={14} />
              レッスン追加
            </button>
          )}
          <button onClick={handleLogout} className="text-muted-foreground">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">読み込み中...</div>
      ) : (
        <div className="flex flex-col gap-4 px-6 pb-8">
          {/* Month Selector */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">{monthLabel}</span>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="text-muted-foreground"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="text-muted-foreground"><ChevronRight size={20} /></button>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex gap-3">
            {[
              { label: "今月のレッスン", value: `${totalLessons}回` },
              { label: "総予約数", value: `${totalBookings}名` },
              { label: "稼働率", value: `${occupancyRate}%` },
            ].map((m) => (
              <div key={m.label} className="flex-1 bg-card rounded-2xl p-4 shadow-sm flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">{m.label}</span>
                <span className="text-xl font-bold">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Add / Edit Form */}
          {formMode.type === "add" && (
            <div className="bg-card rounded-[16px] p-5 shadow-sm">
              <LessonForm
                onSubmit={handleAdd}
                onSubmitMultiple={handleAddMultiple}
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

          {/* Lesson List by Date */}
          {groupedLessons.length === 0 && formMode.type === "closed" && (
            <p className="text-sm text-muted-foreground text-center py-8">この月のレッスンはありません</p>
          )}

          {groupedLessons.map((group) => (
            <div key={group.date} className="flex flex-col gap-2">
              {/* Date Header */}
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">{formatDate(group.date)}</span>
              </div>

              {/* Lessons for this date */}
              {group.lessons.map((lesson) => {
                const isExpanded = expandedLesson === lesson.id;
                const participants = totalParticipants(lesson.bookings);
                const isPast = new Date(lesson.date + "T23:59:59") < new Date();
                const belowMin = participants < lesson.min_seats && !isPast;
                const pub = publishLabel(lesson);

                return (
                  <div key={lesson.id} className={`bg-card rounded-2xl shadow-sm overflow-hidden ${isPast ? "opacity-50" : ""}`}>
                    {/* Lesson Card Header */}
                    <button
                      onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{lesson.title}</span>
                          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${pub.color}`}>{pub.text}</span>
                        </div>
                        {lesson.workshop_subtitle && (
                          <span className="text-xs text-muted-foreground">{lesson.workshop_subtitle}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-muted-foreground" />
                          <span className={`text-sm font-medium ${participants >= lesson.min_seats ? "text-primary" : "text-terracotta"}`}>
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
                        <div className="flex flex-wrap items-center gap-2 p-4 pb-2">
                          <button
                            onClick={() => setFormMode({ type: "edit", lesson })}
                            className="flex items-center gap-1.5 text-sm font-medium text-primary bg-[#C8F0D8] rounded-full px-3 py-1.5"
                          >
                            <Pencil size={13} />
                            編集
                          </button>
                          <button
                            onClick={() => handleTogglePublish(lesson.id, "is_published", lesson.is_published)}
                            className={`text-sm font-medium rounded-full px-3 py-1.5 ${
                              lesson.is_published ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {lesson.is_published ? "非公開にする" : "一般公開する"}
                          </button>
                          {!lesson.is_published && (
                            <button
                              onClick={() => handleTogglePublish(lesson.id, "is_member_published", lesson.is_member_published)}
                              className={`text-sm font-medium rounded-full px-3 py-1.5 ${
                                lesson.is_member_published ? "bg-secondary text-muted-foreground" : "bg-[#E8D5F5] text-[#7B5EA7]"
                              }`}
                            >
                              {lesson.is_member_published ? "会員非公開" : "会員公開する"}
                            </button>
                          )}
                          {confirmDelete === lesson.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleDelete(lesson.id)}
                                className="text-sm font-medium text-primary-foreground bg-destructive rounded-full px-3 py-1.5">
                                本当に削除
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="text-sm text-muted-foreground">やめる</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(lesson.id)}
                              className="flex items-center gap-1.5 text-sm font-medium text-destructive bg-secondary rounded-full px-3 py-1.5">
                              <Trash2 size={13} />
                              削除
                            </button>
                          )}
                        </div>

                        {/* Bookings */}
                        {lesson.bookings.length === 0 ? (
                          <p className="px-4 pb-4 text-sm text-muted-foreground">まだ予約がありません</p>
                        ) : (
                          <div className="flex flex-col gap-2 px-4 pb-4">
                            {lesson.bookings.map((booking) => (
                              <div key={booking.id} className="flex items-center gap-3 bg-background rounded-xl p-3">
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-semibold"
                                  style={{ backgroundColor: getAvatarColor(booking.name) }}>
                                  {booking.name.charAt(0)}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                      {booking.name}
                                      {booking.participant_count > 1 && (
                                        <span className="text-muted-foreground ml-1">+{booking.participant_count - 1}名</span>
                                      )}
                                    </span>
                                    <button
                                      onClick={() => handleTogglePayment(booking.id, booking.payment_status)}
                                      className={`text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0 ${paymentColor[booking.payment_status] ?? paymentColor.unpaid}`}
                                    >
                                      {paymentLabel[booking.payment_status] ?? "未払い"}
                                    </button>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">{booking.email}</span>
                                </div>
                                {/* Cancel */}
                                <button
                                  onClick={() => setConfirmCancel({ ...booking, lessonDate: formatDateShort(lesson.date) })}
                                  className="text-xs text-destructive shrink-0"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Min seats warning */}
                        {belowMin && (
                          <div className="flex items-center gap-2 mx-4 mb-4 bg-[#FFF3E0] rounded-xl p-3">
                            <AlertTriangle size={16} className="text-[#D4A64A] shrink-0" />
                            <span className="text-xs text-[#D4A64A] font-medium">
                              最少催行人数（{lesson.min_seats}名）に達していません
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Data Export Section */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">データエクスポート</span>
              <Download size={18} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              予約・生徒データをCSVファイルとしてダウンロードできます。月1回のバックアップにご利用ください。
            </p>
            <div className="flex gap-3">
              <button onClick={exportBookings}
                className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm font-medium">
                <Calendar size={14} className="text-muted-foreground" />
                予約一覧
              </button>
              <button onClick={exportStudents}
                className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm font-medium">
                <Users size={14} className="text-muted-foreground" />
                生徒一覧
              </button>
            </div>
            <button onClick={() => { exportBookings(); exportStudents(); }}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold">
              <Download size={14} />
              全データをダウンロード
            </button>
          </div>

          {/* Member Management Section */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">会員管理</span>
              <div className="flex items-center gap-1.5">
                <UserCheck size={16} className="text-primary" />
                <span className="text-xs font-medium text-primary">{members.length}名</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              会員のメールアドレスを登録すると、会員先行公開レッスンが表示されます。
            </p>

            {/* Add Member Form */}
            <div className="flex flex-col gap-2 bg-card rounded-xl p-3 border border-border">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="名前（任意）"
                className="h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
              />
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="メールアドレス"
                  onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  className="flex-1 h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberEmail}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  追加
                </button>
              </div>
              {memberError && <p className="text-xs text-destructive">{memberError}</p>}
            </div>

            {/* Member List */}
            {members.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
                    <div className="w-8 h-8 rounded-full bg-[#E8D5F5] flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[#7B5EA7]">
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {member.name && <p className="text-sm font-medium truncate">{member.name}</p>}
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-xs text-destructive shrink-0"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              <button onClick={() => setConfirmCancel(null)}
                className="flex-1 h-11 rounded-full bg-secondary text-foreground text-sm font-medium">
                戻る
              </button>
              <button onClick={() => handleCancelBooking(confirmCancel, confirmCancel.lessonDate)}
                className="flex-1 h-11 rounded-full bg-destructive text-primary-foreground text-sm font-semibold">
                キャンセルする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
