import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

const EDITABLE_FIELDS = [
  "startup_name",
  "problem_statement",
  "solution",
  "target_audience",
  "business_model",
  "revenue_model",
  "deck_path",
] as const;

type Params = { params: Promise<{ id: string }> };

/** GET /api/pitches/:id — fetch one pitch (must be yours). */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("pitches")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return jsonError("Pitch not found", 404);
  return NextResponse.json({ pitch: data });
}

/** PATCH /api/pitches/:id — update editable fields. */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return jsonError("No editable fields provided", 400);
  }

  const { data, error } = await supabase
    .from("pitches")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError("Pitch not found or update failed", 404);
  return NextResponse.json({ pitch: data });
}

/** DELETE /api/pitches/:id — delete a pitch (cascades to its meetings). */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase.from("pitches").delete().eq("id", id);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true });
}
