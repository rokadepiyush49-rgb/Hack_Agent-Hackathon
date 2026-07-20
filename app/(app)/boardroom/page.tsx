import { MeetingControls } from "@/features/boardroom/components/meeting-controls";
import { SeatingGrid } from "@/features/boardroom/components/seating-grid";
import { TranscriptFeed } from "@/features/boardroom/components/transcript-feed";
import { ConsensusPanel } from "@/features/boardroom/components/consensus-panel";
import { PitchHistory } from "@/features/boardroom/components/pitch-history";
import { LiveBoardroom } from "@/features/boardroom/components/live-boardroom";

export default async function BoardroomPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>;
}) {
  const { meeting } = await searchParams;

  // Arriving from a real pitch submission → live session backed by Supabase + Gemini.
  if (meeting) return <LiveBoardroom meetingId={meeting} />;

  // No meeting id → demo walkthrough on mock data.
  return (
    <div>
      <div className="mb-3">
        <MeetingControls />
      </div>
      <div className="mb-6">
        <SeatingGrid />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TranscriptFeed />
        <div className="space-y-6">
          <ConsensusPanel />
          <PitchHistory />
        </div>
      </div>
    </div>
  );
}
