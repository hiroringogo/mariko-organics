"use client";

import { useState } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Plus from "lucide-react/dist/esm/icons/plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

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

interface LessonFormProps {
  initial?: LessonFormData;
  onSubmit: (data: LessonFormData) => Promise<void>;
  onSubmitMultiple?: (dataList: LessonFormData[]) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

export function LessonForm({ initial, onSubmit, onSubmitMultiple, onCancel, submitLabel }: LessonFormProps) {
  // workshop_title = ワークショップ名（例：グルテンフリーワークショップ）
  const [workshopTitle, setWorkshopTitle] = useState(initial?.workshop_title ?? "グルテンフリーワークショップ");
  // workshop_subtitle = クラス名（例：3月：生米パン・ド・ロー）— ユーザーが見るメインタイトル
  const [workshopSubtitle, setWorkshopSubtitle] = useState(initial?.workshop_subtitle ?? "");
  // description = 説明文
  const [description, setDescription] = useState(initial?.description ?? "");
  // dates
  const [dates, setDates] = useState<string[]>(initial?.date ? [initial.date] : [""]);
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? "10:00");
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? "13:00");
  const [totalSeats, setTotalSeats] = useState(initial?.total_seats ?? 6);
  const [minSeats, setMinSeats] = useState(initial?.min_seats ?? 4);
  const [price, setPrice] = useState(initial?.price ?? 52);
  const [isMemberPublished, setIsMemberPublished] = useState(initial?.is_member_published ?? false);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!initial;
  const validDates = dates.filter(Boolean);

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  function autoTitle(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return `${dayNames[d.getDay()]}曜クラス`;
  }

  function buildData(dateStr: string): LessonFormData {
    return {
      title: autoTitle(dateStr),
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      total_seats: totalSeats,
      min_seats: minSeats,
      price,
      workshop_title: workshopTitle,
      workshop_subtitle: workshopSubtitle,
      description,
      is_published: isPublished,
      is_member_published: isMemberPublished || isPublished,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validDates.length === 0) return;
    setSubmitting(true);

    if (isEdit) {
      await onSubmit(buildData(dates[0]));
    } else if (onSubmitMultiple && validDates.length > 1) {
      await onSubmitMultiple(validDates.map(buildData));
    } else {
      await onSubmit(buildData(dates[0]));
    }
    setSubmitting(false);
  }

  function addDate() {
    setDates([...dates, ""]);
  }

  function updateDate(index: number, value: string) {
    const next = [...dates];
    next[index] = value;
    setDates(next);
  }

  function removeDate(index: number) {
    if (dates.length <= 1) return;
    setDates(dates.filter((_, i) => i !== index));
  }

  const inputClass = "h-10 rounded-xl bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors w-full";
  const labelClass = "text-sm font-medium";

  const buttonText = !isEdit && validDates.length > 1
    ? `${validDates.length}件のレッスンを追加`
    : submitLabel;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{submitLabel}</h2>
        <button type="button" onClick={onCancel}>
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* プレビュー的な説明 */}
      <p className="text-xs text-muted-foreground -mt-2">
        ページに表示される順番で入力できます
      </p>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>ワークショップ名</label>
        <input
          type="text"
          value={workshopTitle}
          onChange={(e) => setWorkshopTitle(e.target.value)}
          placeholder="グルテンフリーワークショップ"
          className={inputClass}
        />
        <p className="text-[11px] text-muted-foreground">ページ上部のタグに表示されます</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>クラス名</label>
        <input
          type="text"
          value={workshopSubtitle}
          onChange={(e) => setWorkshopSubtitle(e.target.value)}
          placeholder="3月：生米パン・ド・ロー"
          className={inputClass}
        />
        <p className="text-[11px] text-muted-foreground">メインタイトルとして大きく表示されます</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>説明文</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="レッスンの説明..."
          className="rounded-xl bg-accent px-4 py-3 text-sm border border-input outline-none focus:border-primary transition-colors resize-none w-full" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>日付{!isEdit && dates.length > 1 ? `（${validDates.length}件）` : ""}</label>
        {dates.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="date"
              value={d}
              onChange={(e) => updateDate(i, e.target.value)}
              required={i === 0}
              className={inputClass}
            />
            {!isEdit && dates.length > 1 && (
              <button type="button" onClick={() => removeDate(i)} className="shrink-0 text-muted-foreground">
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {!isEdit && (
          <button
            type="button"
            onClick={addDate}
            className="flex items-center gap-1.5 text-sm text-primary font-medium mt-1"
          >
            <Plus size={14} />
            日付を追加
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className={labelClass}>開始</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className={labelClass}>終了</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className={labelClass}>定員</label>
          <input type="number" value={totalSeats} onChange={(e) => setTotalSeats(Number(e.target.value))} min={1} className={inputClass} />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className={labelClass}>最少人数</label>
          <input type="number" value={minSeats} onChange={(e) => setMinSeats(Number(e.target.value))} min={1} className={inputClass} />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className={labelClass}>料金 ($)</label>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} className={inputClass} />
        </div>
      </div>

      {/* 公開トグル */}
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <span className={labelClass}>会員先行公開</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">ONにすると会員だけに先行表示されます</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMemberPublished(!isMemberPublished)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isMemberPublished || isPublished ? "bg-primary" : "bg-input"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isMemberPublished || isPublished ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className={labelClass}>一般公開</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">ONにすると全員に表示されます</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !isPublished;
              setIsPublished(next);
              if (next) setIsMemberPublished(true);
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? "bg-primary" : "bg-input"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      <button type="submit" disabled={validDates.length === 0 || submitting}
        className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
        {submitting && <Loader2 size={18} className="animate-spin" />}
        {buttonText}
      </button>
    </form>
  );
}
