import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

/** GET /api/meetings — list the current user's meetings (newest first).
 *  Optional query: ?pitch_id=... to filter by pitch. */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const pitchId = new URL(request.url).searchParams.get("pitch_id");

  let query = supabase
    .from("board_meetings")
    .select("*, pitches(startup_name)")
    .order("created_at", { ascending: false });

  if (pitchId) query = query.eq("pitch_id", pitchId);

  const { data, error } = await query;

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ meetings: data });
}

/** POST /api/meetings — start a new board meeting. Body: { pitch_id } */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  let body: { pitch_id?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body.pitch_id) return jsonError("Missing field: pitch_id", 400);

  // Verify the pitch exists and belongs to the user (RLS also enforces this).
  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select("id")
    .eq("id", body.pitch_id)
    .single();

  if (pitchError || !pitch) return jsonError("Pitch not found", 404);

  const { data, error } = await supabase
    .from("board_meetings")
    .insert({
      pitch_id: pitch.id,
      user_id: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ meeting: data }, { status: 201 });
}
