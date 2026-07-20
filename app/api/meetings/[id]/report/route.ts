import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** GET /api/meetings/:id/report */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("meeting_id", id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("No report yet for this meeting", 404);
  return NextResponse.json({ report: data });
}

/** POST /api/meetings/:id/report — save the AI-generated report (upsert).
 *  Body: { content: { executive_summary, strengths, weaknesses, risks,
 *                     swot, verdict, action_plan, investor_memo } } */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body.content || typeof body.content !== "object") {
    return jsonError("Body must include a content object", 400);
  }

  const { data, error } = await supabase
    .from("reports")
    .upsert(
      { meeting_id: id, content: body.content },
      { onConflict: "meeting_id" }
    )
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ report: data }, { status: 201 });
}
