import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type } = body;

  try {
    if (type === "lesson_booking") {
      const { name, email, lessonTitle, lessonDate, lessonTime, participantCount, companionNames } = body;

      const companions = companionNames?.length
        ? `\n同伴者: ${companionNames.join("、")}`
        : "";

      await resend.emails.send({
        from: "Mariko Organics <onboarding@resend.dev>",
        to: email,
        subject: `【Mariko Organics】レッスン予約確認 - ${lessonDate}`,
        text: `${name} 様

レッスンのご予約ありがとうございます！

━━━━━━━━━━━━━━━━━━
📅 日程: ${lessonDate}
🕐 時間: ${lessonTime}
📍 場所: Orange County, CA（詳細は開催確定後にご案内します）
👥 参加人数: ${participantCount}名${companions}
💰 料金: $45 × ${participantCount}名 = $${45 * participantCount}
━━━━━━━━━━━━━━━━━━

【開催確定について】
レッスンは最少催行人数4名に達した時点で開催確定となります。
3日前までに開催確定のご連絡をメールでお送りします。

【キャンセルについて】
キャンセルをご希望の場合は、レッスン3日前までにご連絡ください。

ご質問がありましたら、お気軽にご連絡ください。
楽しみにお待ちしております！

Mariko Organics`,
      });
    } else if (type === "product_order") {
      const { name, email, productName, quantity, totalPrice } = body;

      await resend.emails.send({
        from: "Mariko Organics <onboarding@resend.dev>",
        to: email,
        subject: `【Mariko Organics】物販予約確認 - ${productName}`,
        text: `${name} 様

ご予約ありがとうございます！

━━━━━━━━━━━━━━━━━━
🍵 商品: ${productName}
📦 数量: ${quantity}点
💰 合計: $${totalPrice}
━━━━━━━━━━━━━━━━━━

【お支払い・受け取りについて】
お渡し時にお支払いをお願いいたします。
受け取り日時は改めてご連絡します。

ご質問がありましたら、お気軽にご連絡ください。

Mariko Organics`,
      });
    } else if (type === "booking_cancelled") {
      const { name, email, lessonDate } = body;

      await resend.emails.send({
        from: "Mariko Organics <onboarding@resend.dev>",
        to: email,
        subject: "【Mariko Organics】予約キャンセルのお知らせ",
        text: `${name} 様

いつもありがとうございます。

${lessonDate} のレッスン予約がキャンセルされましたのでお知らせいたします。

別の日程でのご予約をお待ちしております。

ご質問がありましたら、お気軽にご連絡ください。

Mariko Organics`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
