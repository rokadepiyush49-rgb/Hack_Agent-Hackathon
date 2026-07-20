import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const VALID_AGENTS = ["ceo", "cto", "cfo", "cmo", "vc", "moderator"];
const VALID_CATEGORIES = [
  "market_opportunity",
  "technology",
  "finance",
  "marketing",
  "innovation",
  "execution",
  "risk",
];

/** GET /api/meetings/:id/scores */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("scores")
    .select("agent, category, value")
    .eq("meeting_id", id);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ scores: data });
}

/** POST /api/meetings/:id/scores — upsert score(s).
 *  Body: { scores: [{ agent, category, value }, ...] } */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  let body: { scores?: Record<string, unknown>[] };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!Array.isArray(body.scores) || body.scores.length === 0) {
    return jsonError("Body must include a non-empty scores array", 400);
  }

  for (const s of body.scores) {
    if (!VALID_AGENTS.includes(s.agent as string)) {
      return jsonError(`Invalid agent: ${s.agent}`, 400);
    }
    if (!VALID_CATEGORIES.includes(s.category as string)) {
      return jsonError(`Invalid category: ${s.category}`, 400);
    }
    if (typeof s.value !== "number" || s.value < 0 || s.value > 100) {
      return jsonError("Each value must be a number 0-100", 400);
    }
  }

  const rows = body.scores.map((s) => ({
    meeting_id: id,
    agent: s.agent,
    category: s.category,
    value: s.value,
  }));

  const { data, error } = await supabase
    .from("scores")
    .upsert(rows, { onConflict: "meeting_id,agent,category" })
    .select();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ scores: data }, { status: 201 });
}
