import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
];

/** POST /api/pitches/:id/deck — upload a pitch deck (multipart form, field "file").
 *  Stores it in the private pitch-decks bucket and saves the path on the pitch. */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  // Verify the pitch belongs to the user.
  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select("id")
    .eq("id", id)
    .single();
  if (pitchError || !pitch) return jsonError("Pitch not found", 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart form data with a 'file' field", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Missing 'file' field", 400);
  if (file.size === 0) return jsonError("File is empty", 400);
  if (file.size > MAX_SIZE) return jsonError("File too large (max 10 MB)", 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError("Only PDF or PPTX files are allowed", 400);
  }

  const ext = file.type === "application/pdf" ? "pdf" : "pptx";
  // Path must start with the user's id — the storage RLS policy requires it.
  const path = `${user.id}/${id}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("pitch-decks")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return jsonError(uploadError.message, 500);

  // Save the path on the pitch.
  const { data: updated, error: updateError } = await supabase
    .from("pitches")
    .update({ deck_path: path })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return jsonError(updateError.message, 500);
  return NextResponse.json({ pitch: updated }, { status: 201 });
}

/** GET /api/pitches/:id/deck — returns a temporary signed download URL (1 hour). */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data: pitch, error } = await supabase
    .from("pitches")
    .select("deck_path")
    .eq("id", id)
    .single();

  if (error || !pitch) return jsonError("Pitch not found", 404);
  if (!pitch.deck_path) return jsonError("No deck uploaded for this pitch", 404);

  const { data: signed, error: signError } = await supabase.storage
    .from("pitch-decks")
    .createSignedUrl(pitch.deck_path, 3600);

  if (signError || !signed) return jsonError("Could not create download URL", 500);
  return NextResponse.json({ url: signed.signedUrl, expires_in: 3600 });
}

/** DELETE /api/pitches/:id/deck — remove the uploaded deck. */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data: pitch, error } = await supabase
    .from("pitches")
    .select("deck_path")
    .eq("id", id)
    .single();

  if (error || !pitch) return jsonError("Pitch not found", 404);
  if (!pitch.deck_path) return jsonError("No deck to delete", 404);

  const { error: removeError } = await supabase.storage
    .from("pitch-decks")
    .remove([pitch.deck_path]);
  if (removeError) return jsonError(removeError.message, 500);

  await supabase.from("pitches").update({ deck_path: null }).eq("id", id);
  return NextResponse.json({ success: true });
}
