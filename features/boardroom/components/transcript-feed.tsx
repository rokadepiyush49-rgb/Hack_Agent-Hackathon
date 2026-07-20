"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInitials, cn } from "@/lib/utils";
import { transcript as initialTranscript, followUpReplies } from "@/features/boardroom/mock";
import type { TranscriptMessage } from "@/features/boardroom/types";

function nowLabel() {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date());
}

interface TranscriptFeedProps {
  /** When set, the feed renders these real messages instead of the demo script. */
  liveMessages?: TranscriptMessage[];
  /** Live meeting exists but the AI board hasn't responded yet. */
  isConvening?: boolean;
  isLive?: boolean;
}

export function TranscriptFeed({ liveMessages, isConvening, isLive }: TranscriptFeedProps = {}) {
  const [messages, setMessages] = useState<TranscriptMessage[]>(initialTranscript);
  const [draft, setDraft] = useState("");
  const [typingAs, setTypingAs] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, liveMessages, typingAs]);

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    const founderMessage: TranscriptMessage = {
      id: `msg_${Date.now()}`,
      speaker: "You",
      role: "Founder",
      message: trimmed,
      timestamp: nowLabel(),
    };
    setMessages((prev) => [...prev, founderMessage]);
    setDraft("");

    // No live AI wired up yet (see lib/ai/client.ts) — simulate a board
    // response so the session still feels live during a demo.
    const reply = followUpReplies[replyIndex.current % followUpReplies.length]!;
    replyIndex.current += 1;

    setTypingAs(reply.speaker);
    const delay = 900 + Math.random() * 700;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_r`,
          speaker: reply.speaker,
          role: reply.role,
          message: reply.message,
          timestamp: nowLabel(),
        },
      ]);
      setTypingAs(null);
    }, delay);
  }

  const shown = isLive ? (liveMessages ?? []) : messages;

  return (
    <Card className="flex flex-col p-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Live transcript</CardTitle>
        <Badge tone="signal" pulse>
          {isLive ? (isConvening ? "Convening" : "Live") : "Recording"}
        </Badge>
      </CardHeader>

      <CardContent ref={scrollRef} className="max-h-[440px] flex-1 space-y-5 overflow-y-auto pt-0">
        {isLive && isConvening && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-0.5">
              <span className="size-1.5 animate-pulse rounded-full bg-signal [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-pulse rounded-full bg-signal [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-pulse rounded-full bg-signal" />
            </span>
            The board is reviewing your pitch — first takes land in ~30 seconds.
          </div>
        )}
        {shown.map((entry) => {
          const isFounder = entry.role === "Founder";
          return (
            <div key={entry.id} className={cn("flex gap-3", isFounder && "flex-row-reverse text-right")}>
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback className={isFounder ? "bg-primary/20 text-primary" : undefined}>
                  {getInitials(entry.speaker)}
                </AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[85%] space-y-1", isFounder && "items-end")}>
                <div className={cn("flex items-baseline gap-2", isFounder && "flex-row-reverse")}>
                  <span className="text-sm font-medium text-foreground">{entry.speaker}</span>
                  <span className="text-xs text-muted-foreground">{entry.role}</span>
                </div>
                <p
                  className={cn(
                    "inline-block rounded-lg px-3 py-2 text-sm leading-relaxed",
                    isFounder ? "bg-primary/12 text-foreground" : "bg-surface-elevated text-foreground/90",
                  )}
                >
                  {entry.message}
                </p>
                <p className="text-[0.7rem] text-muted-foreground">{entry.timestamp}</p>
              </div>
            </div>
          );
        })}

        {typingAs && (
          <div className="flex items-center gap-2 pl-11 text-xs text-muted-foreground">
            <span className="flex gap-0.5">
              <span className="size-1.5 animate-pulse rounded-full bg-signal [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-pulse rounded-full bg-signal [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-pulse rounded-full bg-signal" />
            </span>
            {typingAs} is typing…
          </div>
        )}
      </CardContent>

      {isLive ? (
        <p className="border-t border-border p-4 text-xs text-muted-foreground">
          Transcript is generated by the AI board and saved to your account.
        </p>
      ) : (
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-4">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply to the board…"
          aria-label="Message the board"
          className="flex-1"
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={!draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
      )}
    </Card>
  );
}
