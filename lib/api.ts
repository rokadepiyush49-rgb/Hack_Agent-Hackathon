import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared helpers for API route handlers.
 */

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Returns the authenticated user + a supabase client, or a 401 response.
 * Usage:
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   const { user, supabase } = auth;
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Not authenticated", 401);
  }

  return { user, supabase };
}
