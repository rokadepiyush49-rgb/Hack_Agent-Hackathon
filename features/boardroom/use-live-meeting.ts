"use client";

import { useEffect, useRef, useState } from "react";

/** Shape of GET /api/meetings/[id] — meeting + nested pitch, messages, scores, report. */
export interface LiveMeetingData {
  id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | string;
  pitches?: { startup_name?: string; solution?: string } | null;
  debate_messages?: Array<{
    id: string;
    agent: string;
    content: string;
    round: number;
    order_index: number;
    created_at: string;
  }>;
  scores?: Array<{ agent: string; category: string; value: number }>;
  reports?: Array<{ content: Record<string, unknown>; created_at: string }> | { content: Record<string, unknown> } | null;
}

/**
 * Polls /api/meetings/[id] every few seconds until the meeting completes.
 * The AI board (POST /api/analyze) writes messages/scores/report to Supabase;
 * this hook is how the boardroom UI sees them appear "live".
 */
export function useLiveMeeting(meetingId: string | null) {
  const [meeting, setMeeting] = useState<LiveMeetingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    if (!meetingId) return;
    stopped.current = false;

    async function poll() {
      try {
        const res = await fetch(`/api/meetings/${meetingId}`, { cache: "no-store" });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed to load meeting (${res.status})`);
        }
        const data = (await res.json()) as { meeting: LiveMeetingData };
        setMeeting(data.meeting);
        setError(null);
        const done =
          data.meeting.status === "completed" || data.meeting.status === "failed";
        if (!done && !stopped.current) setTimeout(poll, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meeting");
        if (!stopped.current) setTimeout(poll, 5000);
      }
    }

    poll();
    return () => {
      stopped.current = true;
    };
  }, [meetingId]);

  return { meeting, error };
}
