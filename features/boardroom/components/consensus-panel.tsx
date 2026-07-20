import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScoreCard } from "@/components/shared/score-card";
import { seatedExecutives } from "@/features/boardroom/mock";

export type Vote = "yes" | "no" | "conditional";

export function voteFromScore(value: number): Vote {
  if (value >= 60) return "yes";
  if (value >= 40) return "conditional";
  return "no";
}

interface ConsensusPanelProps {
  /** Real 0-100 scores per agent from the live meeting; mock data when absent. */
  liveScores?: Array<{ agent: string; value: number }>;
  isLive?: boolean;
}

export function ConsensusPanel({ liveScores, isLive }: ConsensusPanelProps = {}) {
  const liveVotes = (liveScores ?? []).map((s) => voteFromScore(s.value));
  const mockVotes = seatedExecutives.filter((e) => e.vote).map((e) => e.vote as Vote);
  const votes = isLive ? liveVotes : mockVotes;
  const yes = votes.filter((v) => v === "yes").length;
  const no = votes.filter((v) => v === "no").length;
  const conditional = votes.filter((v) => v === "conditional").length;
  const score = isLive
    ? liveScores && liveScores.length > 0
      ? Math.round(liveScores.reduce((sum, s) => sum + s.value, 0) / liveScores.length)
      : 0
    : Math.round((yes / Math.max(votes.length, 1)) * 100);

  return (
    <Card className="p-0">
      <CardHeader>
        <CardTitle className="text-base">Consensus so far</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <ScoreCard label="Running score" score={score} verdict={votes.length === 0 ? "Waiting for the board…" : `${yes} yes · ${conditional} conditional · ${no} no`} size="md" />
        <div className="grid w-full grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface-elevated p-2.5">
            <p className="font-mono text-base font-semibold text-success">{yes}</p>
            <p className="text-[0.7rem] text-muted-foreground">Yes</p>
          </div>
          <div className="rounded-lg bg-surface-elevated p-2.5">
            <p className="font-mono text-base font-semibold text-warning">{conditional}</p>
            <p className="text-[0.7rem] text-muted-foreground">Conditional</p>
          </div>
          <div className="rounded-lg bg-surface-elevated p-2.5">
            <p className="font-mono text-base font-semibold text-destructive">{no}</p>
            <p className="text-[0.7rem] text-muted-foreground">No</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
