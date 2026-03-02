"use client";

import { useState } from "react";
import { TabBar } from "@/components/tab-bar";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import Clock from "lucide-react/dist/esm/icons/clock";
import HandCoins from "lucide-react/dist/esm/icons/hand-coins";
import Check from "lucide-react/dist/esm/icons/check";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { supabase } from "@/lib/supabase";

const product = {
  name: "Smile Tea オーガニック抹茶",
  description:
    "鹿児島・霧島の有機栽培、一番茶のみを使用したセレモニアルグレードの抹茶。140年続く老舗茶園のブレンダーが手がけた、青りんごのような香りとクリーミーな味わいが特徴です。",
  weight: "70g",
  price: 24,
  deadline: "2026-03-27",
  imageUrl: "https://smiletea.co/cdn/shop/products/STmatchaAMZ2.png?v=1612553181",
};

export default function ShopPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isDeadlinePassed = new Date() > new Date(product.deadline + "T23:59:59");

  async function handleSubmit() {
    if (!name || !email) return;
    setSubmitting(true);

    const { error } = await supabase.from("product_orders").insert({
      product_name: product.name,
      name,
      email,
      quantity,
      total_price: product.price * quantity,
    });

    if (!error) {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product_order",
          name,
          email,
          productName: product.name,
          quantity,
          totalPrice: product.price * quantity,
        }),
      }).catch(() => {});
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 gap-4 pb-20">
        <div className="w-16 h-16 rounded-full bg-[#C8F0D8] flex items-center justify-center">
          <Check size={32} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold">予約が完了しました！</h1>
        <p className="text-sm text-muted-foreground text-center">
          {product.name} × {quantity}点<br />
          合計 ${product.price * quantity}<br /><br />
          お渡し時にお支払いください。<br />
          詳細は {email} にご連絡します。
        </p>
        <button
          onClick={() => { setSubmitted(false); setName(""); setEmail(""); setQuantity(1); }}
          className="mt-4 h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold"
        >
          戻る
        </button>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center px-6 h-14">
        <span className="text-xl font-bold text-primary tracking-tight">物販</span>
      </header>

      <div className="flex flex-col gap-6 px-6">
        {/* Product Card */}
        <div className="bg-card rounded-[16px] shadow-sm overflow-hidden">
          {/* Product Image */}
          <div className="h-[240px] bg-[#f0ede8] flex items-center justify-center p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold tracking-tight">{product.name}</h2>
                <span className="text-sm text-muted-foreground">{product.weight}</span>
              </div>
              <span className="text-xl font-bold text-primary">${product.price}</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-terracotta" />
                <span className="text-sm font-medium text-terracotta">
                  予約締切：3月27日（金）
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HandCoins size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  お渡し時にお支払い（手渡し）
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Form */}
        {isDeadlinePassed ? (
          <div className="bg-secondary rounded-[16px] p-5 text-center">
            <span className="text-sm text-muted-foreground">予約受付は終了しました</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold">予約する</h3>

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
              <label className="text-sm font-medium">数量</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-secondary text-foreground font-medium text-lg flex items-center justify-center">
                  −
                </button>
                <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-secondary text-foreground font-medium text-lg flex items-center justify-center">
                  +
                </button>
                <span className="text-sm text-muted-foreground ml-2">
                  合計 ${product.price * quantity}
                </span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!name || !email || submitting}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {submitting && <Loader2 size={18} className="animate-spin" />}
              <ShoppingBag size={18} />
              予約する
            </button>
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
