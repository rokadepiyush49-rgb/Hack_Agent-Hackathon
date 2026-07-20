"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type DebateMessage = {
  id: string;
  meeting_id: string;
  agent: "ceo" | "cto" | "cfo" | "cmo" | "vc" | "moderator";
  content: string;
  round: number;
  order_index: number;
  confidence: number | null;
  is_interruption: boolean;
  created_at: string;
};

export type MeetingStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * Live boardroom hook — for Members 1 & 4.
 *
 * Subscribes to the meeting via Supabase Realtime. New debate messages
 * appear in `messages` the instant the AI writes them; `status` flips
 * when the meeting starts/ends. Drive animations off these:
 *
 *   const { messages, status, latest } = useMeetingStream(meetingId);
 *   // latest?.agent        -> who is speaking (spotlight, camera cut)
 *   // latest?.is_interruption -> abrupt camera cut
 *   // latest?.confidence   -> confidence meter value
 *   // status === "completed" -> play verdict sequence
 */
export function useMeetingStream(meetingId: string | null) {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [status, setStatus] = useState<MeetingStatus>("pending");
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!meetingId) return;
    const supabase = supabaseRef.current;

    // 1. Load what already exists.
    supabase
      .from("debate_messages")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("order_index", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as DebateMessage[]);
      });

    supabase
      .from("board_meetings")
      .select("status")
      .eq("id", meetingId)
      .single()
      .then(({ data }) => {
        if (data) setStatus(data.status as MeetingStatus);
      });

    // 2. Subscribe to live changes.
    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "debate_messages",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          const msg = payload.new as DebateMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id)
              ? prev
              : [...prev, msg].sort((a, b) => a.order_index - b.order_index)
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "board_meetings",
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          setStatus((payload.new as { status: MeetingStatus }).status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId]);

  return {
    messages,
    status,
    latest: messages.length > 0 ? messages[messages.length - 1] : null,
  };
}
