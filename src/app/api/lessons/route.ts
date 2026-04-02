import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Cache the Supabase client at module level for better performance
let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

function getSupabaseAdminClient() {
  // Return cached client if already initialized
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing Supabase environment variables. URL: ${!!supabaseUrl}, ServiceKey: ${!!supabaseServiceKey}`
    );
  }

  // Create and cache the client
  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseAdminClient;
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const body = await request.json();

    console.log("POST /api/lessons called");

    const { data, error } = await supabaseAdmin
      .from("lessons")
      .insert(body)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const body = await request.json();
    const { id, ...updates } = body as { id: string; [key: string]: unknown };

    console.log("PUT /api/lessons called for id:", id);

    const { data, error } = await supabaseAdmin
      .from("lessons")
      .update(updates as Record<string, unknown>)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const body = await request.json();
    const { id } = body;

    console.log("DELETE /api/lessons called for id:", id);

    const { data, error } = await supabaseAdmin
      .from("lessons")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
