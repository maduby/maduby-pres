import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isPresenterAuthorized } from "@/lib/presenter-auth-request";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.PRESENTER_SECRET;
  if (!secret || !(await isPresenterAuthorized(request, secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionIdEnv = process.env.NEXT_PUBLIC_DECK_SESSION_ID;
  if (!sessionIdEnv) {
    return NextResponse.json(
      { error: "Deck session not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionIdBody = (body as { sessionId?: unknown }).sessionId;
  const holderId = (body as { holderId?: unknown }).holderId;

  if (typeof sessionIdBody !== "string" || sessionIdBody !== sessionIdEnv) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
  if (typeof holderId !== "string" || holderId.length < 8 || holderId.length > 128) {
    return NextResponse.json({ error: "Invalid holder" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase not configured on server" },
      { status: 503 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("deck_sessions")
    .update({
      presenter_heartbeat: null,
      presenter_holder_id: null,
    })
    .eq("id", sessionIdEnv)
    .eq("presenter_holder_id", holderId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: Boolean(data?.id) });
}
