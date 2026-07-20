import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** GET /api/meetings/:id/projections — financial projections by year.
 *  Response includes computed profit and negative-profit alerts. */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("projections")
    .select("*")
    .eq("meeting_id", id)
    .order("year", { ascending: true });

  if (error) return jsonError(error.message, 500);

  const projections = (data ?? []).map((p) => ({
    ...p,
    profit: Number(p.revenue) - Number(p.costs),
  }));

  const alerts = projections
    .filter((p) => p.profit < 0)
    .map(
      (p) =>
        `Year ${p.year}: projected loss of ${Math.abs(p.profit).toLocaleString()}`
    );

  return NextResponse.json({ projections, alerts });
}

/** POST /api/meetings/:id/projections — upsert projections (CFO agent output).
 *  Body: { projections: [{ year, revenue, costs, growth?, risks? }] } */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  let body: { projections?: Record<string, unknown>[] };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!Array.isArray(body.projections) || body.projections.length === 0) {
    return jsonError("Body must include a non-empty projections array", 400);
  }

  for (const p of body.projections) {
    if (typeof p.year !== "number" || p.year < 1 || p.year > 10) {
      return jsonError("Each projection needs a year between 1 and 10", 400);
    }
    if (typeof p.revenue !== "number" || typeof p.costs !== "number") {
      return jsonError("Each projection needs numeric revenue and costs", 400);
    }
  }

  const rows = body.projections.map((p) => ({
    meeting_id: id,
    year: p.year,
    revenue: p.revenue,
    costs: p.costs,
    growth: typeof p.growth === "string" ? p.growth : null,
    risks: typeof p.risks === "string" ? p.risks : null,
  }));

  const { data, error } = await supabase
    .from("projections")
    .upsert(rows, { onConflict: "meeting_id,year" })
    .select();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ projections: data }, { status: 201 });
}
