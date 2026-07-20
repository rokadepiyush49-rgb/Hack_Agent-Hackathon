"use client";

import { useState } from "react";
import { Mic, MicOff, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currentPitch } from "@/features/boardroom/mock";

interface MeetingControlsProps {
  liveName?: string;
  liveOneLiner?: string;
  liveStatus?: string;
  isLive?: boolean;
}

export function MeetingControls({ liveName, liveOneLiner, liveStatus, isLive }: MeetingControlsProps = {}) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  const name = isLive ? (liveName ?? "Board session") : currentPitch.startupName;
  const subtitle = isLive
    ? (liveOneLiner ?? "Live AI board session")
    : `${currentPitch.oneLiner} · Asking ${currentPitch.askAmount}`;
  const statusLabel = isLive
    ? liveStatus === "completed"
      ? "Completed"
      : liveStatus === "failed"
        ? "Failed"
        : "Live"
    : paused
      ? "Paused"
      : "Live";

  return (
    <div className="glass sticky top-16 z-10 -mx-4 flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-medium">{name}</h2>
          {!isLive && <Badge tone="muted">{currentPitch.stage}</Badge>}
          <Badge tone={isLive && liveStatus === "failed" ? "destructive" : "signal"} pulse={!paused && liveStatus !== "completed"}>
            {statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((v) => !v)}>
          {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setPaused((v) => !v)}>
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button variant="destructive" size="sm">
          <Square className="size-3.5" />
          End session
        </Button>
      </div>
    </div>
  );
}
