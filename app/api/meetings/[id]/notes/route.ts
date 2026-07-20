import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** GET /api/meetings/:id/notes — the user's notepad entries for a meeting. */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("meeting_id", id)
    .order("created_at", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ notes: data });
}

/** POST /api/meetings/:id/notes — add a note. Body: { content } */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (typeof body.content !== "string" || !body.content.trim()) {
    return jsonError("Missing or empty field: content", 400);
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({ meeting_id: id, user_id: user.id, content: body.content })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ note: data }, { status: 201 });
}
