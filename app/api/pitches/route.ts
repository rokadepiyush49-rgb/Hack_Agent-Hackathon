import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

const REQUIRED_FIELDS = [
  "startup_name",
  "problem_statement",
  "solution",
  "target_audience",
  "business_model",
  "revenue_model",
] as const;

/** GET /api/pitches — list the current user's pitches (newest first). */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("pitches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ pitches: data });
}

/** POST /api/pitches — create a pitch. Body: the 6 required fields. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  for (const field of REQUIRED_FIELDS) {
    if (typeof body[field] !== "string" || !(body[field] as string).trim()) {
      return jsonError(`Missing or empty field: ${field}`, 400);
    }
  }

  const { data, error } = await supabase
    .from("pitches")
    .insert({
      user_id: user.id,
      startup_name: body.startup_name,
      problem_statement: body.problem_statement,
      solution: body.solution,
      target_audience: body.target_audience,
      business_model: body.business_model,
      revenue_model: body.revenue_model,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ pitch: data }, { status: 201 });
}
