"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import Settings from "lucide-react/dist/esm/icons/settings";
import Save from "lucide-react/dist/esm/icons/save";
import Mail from "lucide-react/dist/esm/icons/mail";
import CircleCheck from "lucide-react/dist/esm/icons/circle-check";
import Timer from "lucide-react/dist/esm/icons/timer";
import { supabase } from "@/lib/supabase";
import { LessonForm } from "@/components/lesson-form";

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  participant_count: number;
  companion_names: string[] | null;
  companion_first_time: boolean[] | null;
  notes: string | null;
  status: string;
  payment_status: string;
  is_first_time: boolean;
  referred_by: string | null;
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
  image_url: string | null;
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
  is_member_published?: boolean;
  is_published?: boolean;
  image_url?: string | null;
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
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<{ id: string; template_key: string; display_name: string; subject: string; body: string }[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [pendingMemberCount, setPendingMemberCount] = useState(0);
  const [emailOpen, setEmailOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Month filter - restore from sessionStorage on refresh
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("admin_selectedMonth");
      if (saved) return saved;
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    sessionStorage.setItem("admin_selectedMonth", selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    fetch("/api/admin-auth")
      .then((res) => {
        if (res.ok) setAuthed(true);
      })
      .finally(() => setAuthChecking(false));
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

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      for (const row of data) map[row.key] = row.value;
      setSiteSettings(map);
    }
  }, []);

  const fetchEmailTemplates = useCallback(async () => {
    const res = await fetch("/api/email-templates");
    if (res.ok) {
      const data = await res.json();
      setEmailTemplates(data);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    const res = await fetch("/api/members");
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
      setPendingMemberCount(data.filter((m: Member) => m.status === "pending").length);
    }
    setMembersLoading(false);
  }, []);

  async function confirmMember(id: string) {
    const res = await fetch("/api/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`承認に失敗しました: ${data.error || res.statusText}`);
    }
    await fetchMembers();
  }

  async function deleteMember(id: string) {
    await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchMembers();
  }

  async function handleSaveSettings() {
    setSettingsSaving(true);
    const keys = Object.keys(siteSettings);
    for (const key of keys) {
      await supabase.from("site_settings").upsert(
        { key, value: siteSettings[key] },
        { onConflict: "key" }
      );
    }
    setSettingsSaving(false);
  }

  function updateSetting(key: string, value: string) {
    setSiteSettings((prev) => ({ ...prev, [key]: value }));
  }

  function updateTemplate(id: string, field: "subject" | "body", value: string) {
    setEmailTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  async function handleSaveTemplate(id: string) {
    setTemplateSaving(true);
    const template = emailTemplates.find((t) => t.id === id);
    if (!template) return;
    await fetch("/api/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, subject: template.subject, body: template.body }),
    });
    setTemplateSaving(false);
    setEditingTemplate(null);
  }

  useEffect(() => { if (authed) { fetchData(); fetchSettings(); fetchEmailTemplates(); fetchMembers(); } }, [authed, fetchData, fetchSettings, fetchEmailTemplates, fetchMembers]);

  // Auto-refresh booking data every 5 seconds
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => { fetchData(); }, 5000);
    return () => clearInterval(interval);
  }, [authed, fetchData]);

  // Scroll to form when it opens
  useEffect(() => {
    if (formMode.type !== "closed") {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [formMode]);

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
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("レッスンの追加に失敗しました: " + err.error);
        return;
      }
      setFormMode({ type: "closed" });
      await fetchData();
    } catch (err) {
      alert("レッスンの追加に失敗しました: " + String(err));
    }
  }

  async function handleAddMultiple(dataList: LessonFormData[]) {
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataList),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("レッスンの追加に失敗しました: " + err.error);
        return;
      }
      setFormMode({ type: "closed" });
      await fetchData();
    } catch (err) {
      alert("レッスンの追加に失敗しました: " + String(err));
    }
  }

  async function handleEdit(data: LessonFormData) {
    if (formMode.type !== "edit") return;
    const editingLesson = formMode.lesson;

    // Find sibling lessons with same workshop_subtitle
    const siblings = allLessons.filter(
      (l) => l.id !== editingLesson.id && l.workshop_subtitle === editingLesson.workshop_subtitle && editingLesson.workshop_subtitle
    );

    try {
      // Update the current lesson
      const res = await fetch("/api/lessons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingLesson.id, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("レッスンの更新に失敗しました: " + err.error);
        return;
      }

      // If siblings exist, batch-update shared content (NOT publish settings — those stay per-lesson)
      if (siblings.length > 0) {
        const sharedUpdate: Record<string, unknown> = {};
        if (data.image_url !== editingLesson.image_url) sharedUpdate.image_url = data.image_url;
        if (data.workshop_subtitle !== editingLesson.workshop_subtitle) sharedUpdate.workshop_subtitle = data.workshop_subtitle;
        if (data.description !== editingLesson.description) sharedUpdate.description = data.description;
        if (data.workshop_title !== editingLesson.workshop_title) sharedUpdate.workshop_title = data.workshop_title;
        if (data.price !== editingLesson.price) sharedUpdate.price = data.price;
        if (data.start_time !== editingLesson.start_time) sharedUpdate.start_time = data.start_time;
        if (data.end_time !== editingLesson.end_time) sharedUpdate.end_time = data.end_time;
        if (data.total_seats !== editingLesson.total_seats) sharedUpdate.total_seats = data.total_seats;
        if (data.min_seats !== editingLesson.min_seats) sharedUpdate.min_seats = data.min_seats;
        // Note: is_published and is_member_published are intentionally excluded — publish settings are per-lesson

        if (Object.keys(sharedUpdate).length > 0) {
          const siblingIds = siblings.map((s) => s.id);
          const applyToAll = confirm(
            `同じ「${editingLesson.workshop_subtitle}」のレッスンが他に${siblings.length}件あります。\n写真・説明文などの共通内容を全レッスンに適用しますか？\n（公開設定はこのレッスンのみ変更されます）`
          );
          if (applyToAll) {
            for (const siblingId of siblingIds) {
              await fetch("/api/lessons", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: siblingId, ...sharedUpdate }),
              });
            }
          }
        }
      }

      setFormMode({ type: "closed" });
      await fetchData();
    } catch (err) {
      alert("レッスンの更新に失敗しました: " + String(err));
    }
  }

  async function handleDelete(lessonId: string) {
    try {
      const res = await fetch("/api/lessons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lessonId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("削除に失敗しました: " + err.error);
        return;
      }
      setConfirmDelete(null);
      setExpandedLesson(null);
      await fetchData();
    } catch (err) {
      alert("削除に失敗しました: " + String(err));
    }
  }

  async function handleCancelBooking(booking: Booking, lessonDate: string) {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert("キャンセルに失敗しました: " + (data.error ?? res.status));
      return;
    }

    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "booking_cancelled", name: booking.name, email: booking.email, lessonDate }),
    }).catch(() => {});
    setConfirmCancel(null);
    await fetchData();
  }

  function optimisticUpdateLesson(lessonId: string, update: Record<string, boolean>) {
    setAllLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, ...update } : l))
    );
  }

  async function handleTogglePublish(lessonId: string, field: "is_published" | "is_member_published", current: boolean) {
    const update: Record<string, boolean> = { [field]: !current };
    if (field === "is_published" && !current) {
      update.is_member_published = true;
    }
    optimisticUpdateLesson(lessonId, update);
    fetch("/api/lessons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lessonId, ...update }),
    }).then(() => fetchData()).catch(() => {});
  }

  async function handleDowngradeToMemberOnly(lessonId: string) {
    const update = { is_published: false, is_member_published: true };
    optimisticUpdateLesson(lessonId, update);
    fetch("/api/lessons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lessonId, ...update }),
    }).then(() => fetchData()).catch(() => {});
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
    const headers = ["日付", "レッスン", "名前", "メール", "電話", "人数", "同伴者", "備考", "予約日"];
    const rows = allLessons.flatMap((l) =>
      l.bookings.map((b) => [
        l.date, l.workshop_subtitle || l.title, b.name, b.email, b.phone ?? "",
        String(b.participant_count), (b.companion_names ?? []).join(" / "), b.notes ?? "",
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
    if (lesson.is_published) return { text: "一般公開", color: "bg-[#F5EBE0] text-primary" };
    if (lesson.is_member_published) return { text: "メンバー限定", color: "bg-[#E8D5F5] text-[#7B5EA7]" };
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
            className="h-12 rounded-full bg-cta text-cta-foreground text-base font-semibold disabled:opacity-50">
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
      <header className="flex items-center justify-between px-6 pt-14 pb-2">
        <h1 className="text-lg font-bold tracking-tight">管理者ダッシュボード</h1>
        <div className="flex items-center gap-3">
          {formMode.type === "closed" && (
            <button
              onClick={() => setFormMode({ type: "add" })}
              className="flex items-center gap-1.5 bg-cta text-cta-foreground text-xs font-semibold rounded-full px-3 py-1.5"
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
            <div ref={formRef} className="bg-card rounded-[16px] p-5 shadow-sm">
              <LessonForm
                onSubmit={handleAdd}
                onSubmitMultiple={handleAddMultiple}
                onCancel={() => setFormMode({ type: "closed" })}
                submitLabel="レッスンを追加"
                defaultMonth={selectedMonth}
              />
            </div>
          )}
          {formMode.type === "edit" && (
            <div ref={formRef} className="bg-card rounded-[16px] p-5 shadow-sm">
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
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{lesson.workshop_subtitle || lesson.title}</span>
                          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0 ${pub.color}`}>{pub.text}</span>
                        </div>
                        {lesson.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">{lesson.description}</span>
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
                          {lesson.is_published ? (
                            <>
                              <button
                                onClick={() => handleDowngradeToMemberOnly(lesson.id)}
                                className="text-sm font-medium rounded-full px-3 py-1.5 bg-[#E8D5F5] text-[#7B5EA7]"
                              >
                                メンバー公開にする
                              </button>
                              <button
                                onClick={() => handleTogglePublish(lesson.id, "is_published", true)}
                                className="text-sm font-medium rounded-full px-3 py-1.5 bg-secondary text-muted-foreground"
                              >
                                非公開にする
                              </button>
                            </>
                          ) : lesson.is_member_published ? (
                            <>
                              <button
                                onClick={() => handleTogglePublish(lesson.id, "is_published", false)}
                                className="text-sm font-medium rounded-full px-3 py-1.5 bg-cta text-cta-foreground"
                              >
                                一般公開する
                              </button>
                              <button
                                onClick={() => handleTogglePublish(lesson.id, "is_member_published", true)}
                                className="text-sm font-medium rounded-full px-3 py-1.5 bg-secondary text-muted-foreground"
                              >
                                非公開にする
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleTogglePublish(lesson.id, "is_published", false)}
                                className="text-sm font-medium rounded-full px-3 py-1.5 bg-cta text-cta-foreground"
                              >
                                一般公開する
                              </button>
                              <button
                                onClick={() => handleTogglePublish(lesson.id, "is_member_published", false)}
                                className="text-sm font-medium rounded-full px-3 py-1.5 bg-[#E8D5F5] text-[#7B5EA7]"
                              >
                                メンバー公開する
                              </button>
                            </>
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
                                    {booking.is_first_time && (
                                      <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-[#DBEAFE] text-[#2563EB] shrink-0">初参加</span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">{booking.email}</span>
                                  {booking.referred_by && (
                                    <span className="text-[11px] text-muted-foreground">紹介: {booking.referred_by}</span>
                                  )}
                                  {booking.companion_names && booking.companion_names.length > 0 && (
                                    <div className="flex flex-col gap-0.5 mt-1">
                                      {booking.companion_names.map((cName, ci) => (
                                        <div key={ci} className="flex items-center gap-1.5">
                                          <span className="text-[11px] text-muted-foreground">┗ {cName}</span>
                                          {booking.companion_first_time?.[ci] && (
                                            <span className="text-[9px] font-medium rounded-full px-1.5 py-0 bg-[#DBEAFE] text-[#2563EB]">初参加</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
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

          {/* その他 Section */}
          <div className="flex flex-col gap-3 pt-4">
            <span className="text-[13px] font-semibold text-muted-foreground tracking-wide">その他</span>

            {/* Data Export Accordion */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-base font-semibold">データエクスポート</span>
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-muted-foreground" />
                  {exportOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </div>
              </button>
              {exportOpen && (
                <div className="flex flex-col gap-3 px-4 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    予約・生徒データをCSVファイルとしてダウンロードできます。
                  </p>
                  <div className="flex gap-3">
                    <button onClick={exportBookings}
                      className="flex-1 flex items-center justify-center gap-2 bg-background border border-border rounded-xl py-3 text-sm font-medium">
                      <Calendar size={14} className="text-muted-foreground" />
                      予約一覧
                    </button>
                    <button onClick={exportStudents}
                      className="flex-1 flex items-center justify-center gap-2 bg-background border border-border rounded-xl py-3 text-sm font-medium">
                      <Users size={14} className="text-muted-foreground" />
                      生徒一覧
                    </button>
                  </div>
                  <button onClick={() => { exportBookings(); exportStudents(); }}
                    className="flex items-center justify-center gap-2 bg-cta text-cta-foreground rounded-xl py-3 text-sm font-semibold">
                    <Download size={14} />
                    全データをダウンロード
                  </button>
                </div>
              )}
            </div>

            {/* Membership Page Settings Accordion */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setMembershipOpen(!membershipOpen)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-base font-semibold">メンバーシップページ編集</span>
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-muted-foreground" />
                  {membershipOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </div>
              </button>
              {membershipOpen && (
                <div className="flex flex-col gap-3 px-4 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    メンバーシップページに表示される価格・特典の内容を編集できます。
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">年会費</label>
                      <input
                        type="text"
                        value={siteSettings.membership_price ?? ""}
                        onChange={(e) => updateSetting("membership_price", e.target.value)}
                        placeholder="$40"
                        className="h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">月あたり価格</label>
                      <input
                        type="text"
                        value={siteSettings.membership_price_monthly ?? ""}
                        onChange={(e) => updateSetting("membership_price_monthly", e.target.value)}
                        placeholder="$3.3"
                        className="h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">特典 {i}</label>
                        <input
                          type="text"
                          value={siteSettings[`membership_benefit_${i}`] ?? ""}
                          onChange={(e) => updateSetting(`membership_benefit_${i}`, e.target.value)}
                          placeholder={`特典${i}のタイトル`}
                          className="h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
                        />
                        <input
                          type="text"
                          value={siteSettings[`membership_benefit_${i}_desc`] ?? ""}
                          onChange={(e) => updateSetting(`membership_benefit_${i}_desc`, e.target.value)}
                          placeholder={`特典${i}の説明`}
                          className="h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    ))}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">注意書き</label>
                      <input
                        type="text"
                        value={siteSettings.membership_note ?? ""}
                        onChange={(e) => updateSetting("membership_note", e.target.value)}
                        placeholder="いつでも解約可能。お気軽にお申し込みください。"
                        className="h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      disabled={settingsSaving}
                      className="flex items-center justify-center gap-2 h-10 rounded-lg bg-cta text-cta-foreground text-sm font-semibold disabled:opacity-50 mt-1"
                    >
                      {settingsSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      保存する
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Member Management Accordion */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => { setMembersOpen(!membersOpen); if (!membersOpen) fetchMembers(); }}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-base font-semibold">メンバー管理</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Users size={18} className="text-muted-foreground" />
                    {pendingMemberCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#E8740C] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {pendingMemberCount}
                      </span>
                    )}
                  </div>
                  {membersOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </div>
              </button>
              {membersOpen && (
                <div className="flex flex-col gap-3 px-4 pb-4">
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">メンバーはまだいません</p>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <div className="flex-1 bg-background border border-border rounded-xl p-3">
                          <div className="text-xs text-muted-foreground">総メンバー</div>
                          <div className="text-xl font-bold">{members.length}名</div>
                        </div>
                        <div className="flex-1 bg-background border border-border rounded-xl p-3">
                          <div className="text-xs text-muted-foreground">承認待ち</div>
                          <div className="text-xl font-bold text-[#E8740C]">{members.filter(m => m.status === "pending").length}名</div>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        {members.map((member) => (
                          <div key={member.id} className="flex flex-col gap-2 py-3 border-b border-border last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold">{member.name || "名前未設定"}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                              {member.status === "pending" ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-[#FFF3E0] text-[#E8740C]">
                                  <Timer size={10} />
                                  承認待ち
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-[#F5EBE0] text-primary">
                                  <CircleCheck size={10} />
                                  承認済み
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground">
                                {member.status === "confirmed" && member.confirmed_at
                                  ? `承認: ${new Date(member.confirmed_at).toLocaleDateString("ja-JP")}`
                                  : `申請: ${new Date(member.created_at).toLocaleDateString("ja-JP")}`}
                              </span>
                              <div className="flex items-center gap-2">
                                {member.status === "pending" && (
                                  <button
                                    onClick={() => confirmMember(member.id)}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary rounded-md px-2.5 py-1"
                                  >
                                    <CircleCheck size={12} />
                                    承認
                                  </button>
                                )}
                                <button
                                  onClick={() => { if (confirm(`${member.name || member.email} を削除しますか？`)) deleteMember(member.id); }}
                                  className="text-[11px] text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Email Templates Accordion */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setEmailOpen(!emailOpen)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-base font-semibold">メール文面</span>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-muted-foreground" />
                  {emailOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </div>
              </button>
              {emailOpen && (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {emailTemplates.map((template) => (
                    <div key={template.id} className="bg-background rounded-xl overflow-hidden">
                      <button
                        onClick={() => setEditingTemplate(editingTemplate === template.id ? null : template.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left border-b border-border last:border-b-0"
                      >
                        <span className="text-sm font-medium">{template.display_name}</span>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </button>
                      {editingTemplate === template.id && (
                        <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground font-medium">件名</label>
                            <input
                              type="text"
                              value={template.subject}
                              onChange={(e) => updateTemplate(template.id, "subject", e.target.value)}
                              className="h-9 rounded-lg bg-accent px-3 text-sm border border-input outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground font-medium">本文</label>
                            <textarea
                              value={template.body}
                              onChange={(e) => updateTemplate(template.id, "body", e.target.value)}
                              rows={12}
                              className="rounded-lg bg-accent px-3 py-2 text-sm border border-input outline-none focus:border-primary transition-colors resize-y leading-relaxed"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {template.body.match(/\{\{[^}]+\}\}/g)?.filter((v, i, a) => a.indexOf(v) === i).map((v) => (
                              <span key={v} className="text-[10px] bg-secondary text-muted-foreground rounded-full px-2 py-0.5">{v}</span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSaveTemplate(template.id)}
                            disabled={templateSaving}
                            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-cta text-cta-foreground text-sm font-semibold disabled:opacity-50"
                          >
                            {templateSaving ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            保存する
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
