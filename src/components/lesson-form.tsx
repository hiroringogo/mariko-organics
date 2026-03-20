"use client";

import { useState, useRef } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Plus from "lucide-react/dist/esm/icons/plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ImageIcon from "lucide-react/dist/esm/icons/image";
import { supabase } from "@/lib/supabase";

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
  workshop_subtitle_en?: string;
  description: string;
  description_en?: string;
  is_member_published?: boolean;
  is_published?: boolean;
  image_url?: string | null;
}

interface LessonFormProps {
  initial?: LessonFormData & { image_url?: string | null };
  onSubmit: (data: LessonFormData) => Promise<void>;
  onSubmitMultiple?: (dataList: LessonFormData[]) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  defaultMonth?: string; // "YYYY-MM" format — カレンダーをこの月で開く
}

export function LessonForm({ initial, onSubmit, onSubmitMultiple, onCancel, submitLabel, defaultMonth }: LessonFormProps) {
  // workshop_title = ワークショップ名（例：グルテンフリーワークショップ）
  const [workshopTitle, setWorkshopTitle] = useState(initial?.workshop_title ?? "グルテンフリーワークショップ");
  // workshop_subtitle = クラス名（例：3月：生米パン・ド・ロー）— ユーザーが見るメインタイトル
  const [workshopSubtitle, setWorkshopSubtitle] = useState(initial?.workshop_subtitle ?? "");
  const [workshopSubtitleEn, setWorkshopSubtitleEn] = useState(initial?.workshop_subtitle_en ?? "");
  // description = 説明文
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial?.description_en ?? "");
  // dates — 管理画面で選択中の月の1日をデフォルトに設定
  const [dates, setDates] = useState<string[]>(() => {
    if (initial?.date) return [initial.date];
    if (defaultMonth) return [`${defaultMonth}-01`];
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yyyy = nextMonth.getFullYear();
    const mm = String(nextMonth.getMonth() + 1).padStart(2, "0");
    return [`${yyyy}-${mm}-01`];
  });
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? "10:00");
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? "13:00");
  const [totalSeats, setTotalSeats] = useState(initial?.total_seats ?? 6);
  const [minSeats, setMinSeats] = useState(initial?.min_seats ?? 4);
  const [price, setPrice] = useState(initial?.price ?? 50);
  const [isMemberPublished, setIsMemberPublished] = useState(initial?.is_member_published ?? false);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initial;
  const validDates = dates.filter(Boolean);

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  function autoTitle(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return `${dayNames[d.getDay()]}曜クラス`;
  }

  async function uploadImage(): Promise<string | undefined> {
    if (!imageFile) return initial?.image_url || undefined;
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("lesson-images")
      .upload(fileName, imageFile, { upsert: true });
    if (error) {
      alert("画像のアップロードに失敗しました: " + error.message);
      return initial?.image_url || undefined;
    }
    const { data: urlData } = supabase.storage
      .from("lesson-images")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function buildData(dateStr: string, imageUrl?: string): LessonFormData {
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
      workshop_subtitle_en: workshopSubtitleEn || undefined,
      description,
      description_en: descriptionEn || undefined,
      is_member_published: isMemberPublished,
      is_published: isPublished,
      image_url: imageUrl,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validDates.length === 0) return;
    setSubmitting(true);

    const imageUrl = await uploadImage();

    if (isEdit) {
      await onSubmit(buildData(dates[0], imageUrl));
    } else if (onSubmitMultiple && validDates.length > 1) {
      await onSubmitMultiple(validDates.map((d) => buildData(d, imageUrl)));
    } else {
      await onSubmit(buildData(dates[0], imageUrl));
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
        <label className={labelClass}>クラス名</label>
        <input
          type="text"
          value={workshopSubtitle}
          onChange={(e) => setWorkshopSubtitle(e.target.value)}
          placeholder="3月：生米パン・ド・ロー"
          className={inputClass}
        />
        <p className="text-[11px] text-muted-foreground">メインタイトルとして大きく表示されます</p>
        <input
          type="text"
          value={workshopSubtitleEn}
          onChange={(e) => setWorkshopSubtitleEn(e.target.value)}
          placeholder="English title (e.g. Raw Rice Pão de Ló)"
          className={inputClass + " mt-1"}
        />
        <p className="text-[11px] text-muted-foreground">🇺🇸 英語版タイトル（空欄なら日本語が表示されます）</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>説明文</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="レッスンの説明..."
          className="rounded-xl bg-accent px-4 py-3 text-sm border border-input outline-none focus:border-primary transition-colors resize-none w-full" />
        <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={3} placeholder="English description..."
          className="rounded-xl bg-accent px-4 py-3 text-sm border border-input outline-none focus:border-primary transition-colors resize-none w-full mt-1" />
        <p className="text-[11px] text-muted-foreground">🇺🇸 英語版説明文（空欄なら日本語が表示されます）</p>
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>ヒーロー写真</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden h-[140px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="プレビュー" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 text-foreground text-xs font-medium rounded-full px-3 py-1.5"
              >
                写真を変更
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 h-[100px] rounded-xl border-2 border-dashed border-input bg-accent text-muted-foreground hover:border-primary transition-colors"
          >
            <ImageIcon size={24} />
            <span className="text-xs">タップして写真を選択</span>
          </button>
        )}
        <p className="text-[11px] text-muted-foreground">レッスンページの上部に表示されます</p>
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
            <span className={labelClass}>プレミアメンバー限定公開</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">ONにするとプレミアメンバーだけに表示されます</p>
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
        {!isMemberPublished && !isPublished ? "下書きとして保存" : buttonText}
      </button>
      {!isMemberPublished && !isPublished && (
        <p className="text-xs text-muted-foreground text-center -mt-2">公開設定はあとから変更できます</p>
      )}
    </form>
  );
}
