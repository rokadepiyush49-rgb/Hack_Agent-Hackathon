// src/app/api/analyze/route.ts

import { NextRequest, NextResponse } from "next/server";

import { analyzeStartup } from "@/src/services/boardroomService";
import { StartupInput } from "@/src/types/boardroom";
import { jsonError, requireUser } from "@/lib/api";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  let body: StartupInput & { meeting_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const {
    meeting_id,
    startupName,
    industry,
    problem,
    solution,
    targetMarket,
    businessModel,
    competition,
    fundingRequired,
  } = body;

  if (!meeting_id) {
    return jsonError("Missing field: meeting_id", 400);
  }

  if (
    !startupName?.trim() ||
    !industry?.trim() ||
    !problem?.trim() ||
    !solution?.trim() ||
    !targetMarket?.trim() ||
    !businessModel?.trim()
  ) {
    return jsonError("Missing required startup information.", 400);
  }

  // Confirm the meeting exists and belongs to this user (RLS also enforces this).
  const { data: meeting, error: meetingError } = await supabase
    .from("board_meetings")
    .select("id, status")
    .eq("id", meeting_id)
    .single();

  if (meetingError || !meeting) {
    return jsonError("Meeting not found", 404);
  }

  await supabase
    .from("board_meetings")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", meeting_id);

  try {
    const analysis = await analyzeStartup({
      startupName: startupName.trim(),
      industry: industry.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      targetMarket: targetMarket.trim(),
      businessModel: businessModel.trim(),
      competition: competition?.trim() || "Not specified",
      fundingRequired: fundingRequired?.trim() || "Not specified",
    });

    // 1. Debate messages — one row per line of the conversation, in order.
    const messageRows = analysis.conversation.map((msg, index) => ({
      meeting_id,
      agent: msg.role.toLowerCase(),
      content: msg.message,
      round: 1,
      order_index: index,
    }));

    const { error: messagesError } = await supabase
      .from("debate_messages")
      .insert(messageRows);

    if (messagesError) throw new Error(messagesError.message);

    // 2. Scores — one row per executive, stored under the 'overall' category,
    //    scaled from the prompt's 0-10 range to the schema's 0-100 range.
    const scoreRows = (
      ["ceo", "cto", "cfo", "cmo", "vc"] as const
    ).map((agent) => ({
      meeting_id,
      agent,
      category: "overall",
      value: analysis.scores[agent].score * 10,
    }));

    const { error: scoresError } = await supabase
      .from("scores")
      .upsert(scoreRows, { onConflict: "meeting_id,agent,category" });

    if (scoresError) throw new Error(scoresError.message);

    // 3. Report — the full structured output, stored as JSON.
    const { error: reportError } = await supabase.from("reports").upsert(
      {
        meeting_id,
        content: {
          strengths: analysis.strengths,
          risks: analysis.risks,
          decision: analysis.decision,
          report: analysis.report,
        },
      },
      { onConflict: "meeting_id" }
    );

    if (reportError) throw new Error(reportError.message);

    // 4. Flip the meeting to completed with the aggregate verdict.
    const decisionMap: Record<string, string> = {
      INVEST: "invest",
      CONSIDER: "pivot",
      PASS: "reject",
    };

    await supabase
      .from("board_meetings")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        decision: decisionMap[analysis.decision.verdict],
        overall_score:
          Object.values(analysis.scores).reduce(
            (sum, s) => sum + s.score,
            0
          ) * 2, // average of 5 scores (0-10) scaled to 0-100
      })
      .eq("id", meeting_id);

    return NextResponse.json(
      { success: true, data: analysis },
      { status: 200 }
    );
  } catch (error) {
    console.error("Analyze API Error:", error);

    await supabase
      .from("board_meetings")
      .update({ status: "failed" })
      .eq("id", meeting_id);

    return jsonError("Failed to analyze startup.", 500);
  }
}
