"use client";

import { MeetingControls } from "@/features/boardroom/components/meeting-controls";
import { SeatingGrid } from "@/features/boardroom/components/seating-grid";
import { TranscriptFeed } from "@/features/boardroom/components/transcript-feed";
import { ConsensusPanel, voteFromScore } from "@/features/boardroom/components/consensus-panel";
import { PitchHistory } from "@/features/boardroom/components/pitch-history";
import { useLiveMeeting } from "@/features/boardroom/use-live-meeting";
import { seatedExecutives } from "@/features/boardroom/mock";
import type { TranscriptMessage } from "@/features/boardroom/types";
import type { ExecutiveRole } from "@/components/shared/executive-card";

const AGENT_META: Record<string, { name: string; role: ExecutiveRole }> =
  Object.fromEntries(seatedExecutives.map((e) => [e.id, { name: e.name, role: e.role }]));

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function LiveBoardroom({ meetingId }: { meetingId: string }) {
  const { meeting, error } = useLiveMeeting(meetingId);

  const rawMessages = meeting?.debate_messages ?? [];
  const liveMessages: TranscriptMessage[] = rawMessages.map((m) => {
    const meta = AGENT_META[m.agent];
    return {
      id: m.id,
      speaker: meta?.name ?? m.agent.toUpperCase(),
      role: meta?.role ?? "CEO Agent",
      message: m.content,
      timestamp: timeLabel(m.created_at),
    };
  });

  const overallScores = (meeting?.scores ?? [])
    .filter((s) => s.category === "overall")
    .map((s) => ({ agent: s.agent, value: s.value }));

  const liveVotes = Object.fromEntries(
    overallScores.map((s) => [s.agent, voteFromScore(s.value)])
  );

  const isConvening =
    !meeting || (rawMessages.length === 0 && meeting.status !== "failed");

  return (
    <div>
      <div className="mb-3">
        <MeetingControls
          isLive
          liveName={meeting?.pitches?.startup_name}
          liveOneLiner={meeting?.pitches?.solution}
          liveStatus={meeting?.status}
        />
      </div>
      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="mb-6">
        <SeatingGrid isLive liveVotes={liveVotes} isConvening={isConvening} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TranscriptFeed isLive liveMessages={liveMessages} isConvening={isConvening} />
        <div className="space-y-6">
          <ConsensusPanel isLive liveScores={overallScores} />
          <PitchHistory />
        </div>
      </div>
    </div>
  );
}
