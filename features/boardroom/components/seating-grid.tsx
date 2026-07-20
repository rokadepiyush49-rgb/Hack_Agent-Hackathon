import { getInitials, cn } from "@/lib/utils";
import { AvatarFallback, AvatarPresenceRing } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { seatedExecutives } from "@/features/boardroom/mock";

const voteTone = { yes: "success", no: "destructive", conditional: "warning" } as const;
const voteLabel = { yes: "Yes", no: "No", conditional: "Conditional" } as const;

interface SeatingGridProps {
  /** agent id ("ceo", "cto"...) -> vote, from live scores. */
  liveVotes?: Record<string, "yes" | "no" | "conditional">;
  isLive?: boolean;
  isConvening?: boolean;
}

export function SeatingGrid({ liveVotes, isLive, isConvening }: SeatingGridProps = {}) {
  const roster = isLive
    ? seatedExecutives
        .filter((e) => ["ceo", "cto", "cfo", "cmo", "vc"].includes(e.id))
        .map((e) => ({
          ...e,
          presence: (isConvening ? "speaking" : "active") as typeof e.presence,
          vote: liveVotes?.[e.id],
        }))
    : seatedExecutives;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {roster.map((exec) => (
        <div
          key={exec.id}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center",
            exec.presence === "speaking" && "border-signal/40 bg-signal/5",
          )}
        >
          <AvatarPresenceRing presence={exec.presence} size="lg">
            <AvatarFallback>{getInitials(exec.name)}</AvatarFallback>
          </AvatarPresenceRing>
          <div>
            <p className="text-xs font-medium text-foreground">{exec.name}</p>
            <p className="text-[0.7rem] text-muted-foreground">{exec.role}</p>
          </div>
          {exec.vote && (
            <Badge tone={voteTone[exec.vote]} className="mt-0.5">
              {voteLabel[exec.vote]}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
