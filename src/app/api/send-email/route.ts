import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

function replacePlaceholders(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, email } = body;

  try {
    let templateKey: string;
    let vars: Record<string, string> = {};

    if (type === "lesson_booking" || type === "lesson_booking_first") {
      const { name, lessonTitle, lessonDate, lessonTime, participantCount, companionNames, lessonPrice } = body;
      const price = lessonPrice || 50;
      const companions = companionNames?.length
        ? `\n同伴者: ${companionNames.join("、")}`
        : "";

      templateKey = type;
      vars = {
        customer_name: name,
        lesson_date: lessonDate,
        lesson_time: lessonTime,
        participant_count: String(participantCount),
        companion_names: companions,
        price: String(price),
        total_price: String(price * participantCount),
      };
    } else if (type === "product_order") {
      const { name, productName, quantity, totalPrice } = body;

      templateKey = "product_order";
      vars = {
        customer_name: name,
        product_name: productName,
        quantity: String(quantity),
        total_price: String(totalPrice),
      };
    } else if (type === "booking_cancelled") {
      const { name, lessonDate } = body;

      templateKey = "booking_cancelled";
      vars = {
        customer_name: name,
        lesson_date: lessonDate,
      };
    } else if (type === "lesson_reminder") {
      const { name, lessonDate, lessonTime, location } = body;

      templateKey = "lesson_reminder";
      vars = {
        customer_name: name,
        lesson_date: lessonDate,
        lesson_time: lessonTime,
        location: location || "Orange County, CA",
      };
    } else if (type === "membership_signup") {
      const { name } = body;

      templateKey = "membership_signup";
      vars = {
        customer_name: name,
      };
    } else if (type === "admin_new_member") {
      // Notify admin about new member application
      const { name } = body;
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "admin_email")
        .single();
      const adminEmail = settingsData?.value || process.env.ADMIN_EMAIL || "admin@example.com";
      await resend.emails.send({
        from: "Mariko Organics <noreply@send.authenticknt.com>",
        to: adminEmail,
        subject: `新しいメンバー申請: ${name}様`,
        text: `${name}様（${email}）から新しいメンバー申請がありました。\n\n管理画面のメンバー管理から承認してください。\nhttps://ca.authenticknt.com/admin`,
      });
      return NextResponse.json({ success: true });
    } else if (type === "member_approved") {
      // Notify user that their membership has been approved
      const { name } = body;
      await resend.emails.send({
        from: "Mariko Organics <noreply@send.authenticknt.com>",
        to: email,
        subject: "メンバーシップが承認されました",
        text: `${name}様\n\nメンバーシップが承認されました。\n\nMariko Organics`,
      });
      return NextResponse.json({ success: true });
    } else if (type === "admin_booking_change") {
      // Direct admin notification - no template needed
      const { bookingName, lessonDate, participantCount, companionNames } = body;
      // Try site_settings first, then env var
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "admin_email")
        .single();
      const adminEmail = settingsData?.value || process.env.ADMIN_EMAIL || "admin@example.com";
      if (!adminEmail) {
        return NextResponse.json({ error: "Admin email not configured" }, { status: 500 });
      }
      const companions = companionNames?.length
        ? `\n同伴者: ${companionNames.join("、")}`
        : "";
      await resend.emails.send({
        from: "Mariko Organics <noreply@send.authenticknt.com>",
        to: adminEmail,
        subject: `予約変更: ${bookingName}様`,
        text: `${bookingName}様が予約内容を変更しました。\n\nレッスン日: ${lessonDate}\n参加人数: ${participantCount}名${companions}\n\n管理画面で詳細をご確認ください。`,
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    // Fetch template from Supabase
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("subject, body")
      .eq("template_key", templateKey)
      .single();

    if (templateError || !template) {
      console.error("Template fetch error:", templateError);
      return NextResponse.json({ error: "Template not found" }, { status: 500 });
    }

    const subject = replacePlaceholders(template.subject, vars);
    const text = replacePlaceholders(template.body, vars);

    await resend.emails.send({
      from: "Mariko Organics <noreply@send.authenticknt.com>",
      to: email,
      subject,
      text,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
