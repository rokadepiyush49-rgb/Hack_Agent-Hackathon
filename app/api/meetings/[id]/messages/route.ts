import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const VALID_AGENTS = ["ceo", "cto", "cfo", "cmo", "vc", "moderator"];

/** GET /api/meetings/:id/messages — debate transcript in order. */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("debate_messages")
    .select("*")
    .eq("meeting_id", id)
    .order("order_index", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ messages: data });
}

/** POST /api/meetings/:id/messages — append message(s) to the debate.
 *  Body: { agent, content, round? }  OR  { messages: [{...}, ...] }
 *  order_index is assigned automatically. Used by Member 2's debate engine. */
export async function POST(request: Request, { params }: Params) {
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

  const incoming = Array.isArray(body.messages)
    ? (body.messages as Record<string, unknown>[])
    : [body];

  if (incoming.length === 0) return jsonError("No messages provided", 400);

  for (const msg of incoming) {
    if (!VALID_AGENTS.includes(msg.agent as string)) {
      return jsonError(`Invalid agent. One of: ${VALID_AGENTS.join(", ")}`, 400);
    }
    if (typeof msg.content !== "string" || !msg.content.trim()) {
      return jsonError("Each message needs non-empty content", 400);
    }
    if (
      msg.confidence !== undefined &&
      (typeof msg.confidence !== "number" ||
        msg.confidence < 0 ||
        msg.confidence > 100)
    ) {
      return jsonError("confidence must be a number 0-100", 400);
    }
  }

  // Find the current max order_index for this meeting.
  const { data: last } = await supabase
    .from("debate_messages")
    .select("order_index")
    .eq("meeting_id", id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextIndex = (last?.order_index ?? -1) + 1;

  const rows = incoming.map((msg) => ({
    meeting_id: id,
    agent: msg.agent,
    content: msg.content,
    round: typeof msg.round === "number" ? msg.round : 1,
    confidence: typeof msg.confidence === "number" ? msg.confidence : null,
    is_interruption: msg.is_interruption === true,
    order_index: nextIndex++,
  }));

  const { data, error } = await supabase
    .from("debate_messages")
    .insert(rows)
    .select();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ messages: data }, { status: 201 });
}
