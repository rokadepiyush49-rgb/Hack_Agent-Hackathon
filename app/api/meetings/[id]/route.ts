import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["pending", "in_progress", "completed", "failed"];
const VALID_DECISIONS = ["invest", "pivot", "reject"];

/** GET /api/meetings/:id — full meeting: pitch, messages, scores, report. */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data: meeting, error } = await supabase
    .from("board_meetings")
    .select(
      `*,
       pitches(*),
       debate_messages(id, agent, content, round, order_index, created_at),
       scores(agent, category, value),
       reports(content, created_at)`
    )
    .eq("id", id)
    .order("order_index", {
      referencedTable: "debate_messages",
      ascending: true,
    })
    .single();

  if (error || !meeting) return jsonError("Meeting not found", 404);
  return NextResponse.json({ meeting });
}

/** PATCH /api/meetings/:id — update status/decision/score.
 *  Body: { status?, decision?, overall_score? } */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  let body: {
    status?: string;
    decision?: string;
    overall_score?: number;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return jsonError(`Invalid status. One of: ${VALID_STATUSES.join(", ")}`, 400);
    }
    updates.status = body.status;
    if (body.status === "in_progress") updates.started_at = new Date().toISOString();
    if (body.status === "completed") updates.completed_at = new Date().toISOString();
  }

  if (body.decision !== undefined) {
    if (!VALID_DECISIONS.includes(body.decision)) {
      return jsonError(`Invalid decision. One of: ${VALID_DECISIONS.join(", ")}`, 400);
    }
    updates.decision = body.decision;
  }

  if (body.overall_score !== undefined) {
    if (
      typeof body.overall_score !== "number" ||
      body.overall_score < 0 ||
      body.overall_score > 100
    ) {
      return jsonError("overall_score must be a number 0-100", 400);
    }
    updates.overall_score = body.overall_score;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("Nothing to update", 400);
  }

  const { data, error } = await supabase
    .from("board_meetings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError("Meeting not found or update failed", 404);
  return NextResponse.json({ meeting: data });
}

/** DELETE /api/meetings/:id */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase.from("board_meetings").delete().eq("id", id);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true });
}
