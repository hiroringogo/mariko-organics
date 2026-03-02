"use client";

import { useState } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

interface LessonFormProps {
  initial?: {
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
  };
  onSubmit: (data: {
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
  }) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

export function LessonForm({ initial, onSubmit, onCancel, submitLabel }: LessonFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "水曜クラス");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? "10:00");
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? "13:00");
  const [totalSeats, setTotalSeats] = useState(initial?.total_seats ?? 6);
  const [minSeats, setMinSeats] = useState(initial?.min_seats ?? 4);
  const [price, setPrice] = useState(initial?.price ?? 45);
  const [workshopTitle, setWorkshopTitle] = useState(initial?.workshop_title ?? "Gluten Free Workshop");
  const [workshopSubtitle, setWorkshopSubtitle] = useState(initial?.workshop_subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      total_seats: totalSeats,
      min_seats: minSeats,
      price,
      workshop_title: workshopTitle,
      workshop_subtitle: workshopSubtitle,
      description,
    });
    setSubmitting(false);
  }

  const inputClass = "h-10 rounded-xl bg-accent px-4 text-sm border border-input outline-none focus:border-primary transition-colors w-full";
  const labelClass = "text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{submitLabel}</h2>
        <button type="button" onClick={onCancel}>
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>クラス名</label>
        <select value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass}>
          <option value="水曜クラス">水曜クラス</option>
          <option value="土曜クラス">土曜クラス</option>
          <option value="特別クラス">特別クラス</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>日付</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
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

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>ワークショップ名</label>
        <input type="text" value={workshopTitle} onChange={(e) => setWorkshopTitle(e.target.value)} placeholder="Gluten Free Workshop" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>今月のテーマ</label>
        <input type="text" value={workshopSubtitle} onChange={(e) => setWorkshopSubtitle(e.target.value)} placeholder="生米のサクサクサブレ" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>説明文</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="レッスンの説明..."
          className="rounded-xl bg-accent px-4 py-3 text-sm border border-input outline-none focus:border-primary transition-colors resize-none w-full" />
      </div>

      <button type="submit" disabled={!date || submitting}
        className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
        {submitting && <Loader2 size={18} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}
