import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pastSessions } from "@/features/boardroom/mock";

const statusTone = { completed: "success", "in-progress": "signal", scheduled: "muted" } as const;
const statusLabel = { completed: "Completed", "in-progress": "In session", scheduled: "Scheduled" } as const;

export function PitchHistory() {
  return (
    <Card className="p-0">
      <CardHeader>
        <CardTitle className="text-base">Pitch history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {pastSessions.map((session) => (
          <Link
            key={session.id}
            href={session.status === "completed" ? `/reports/${session.id}` : "/boardroom"}
            className="block rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-elevated"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{session.startupName}</p>
                <p className="truncate text-xs text-muted-foreground">{session.oneLiner}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {session.investmentScore !== undefined && (
                  <span className="font-mono text-sm font-medium text-foreground">{session.investmentScore}</span>
                )}
                <Badge tone={statusTone[session.status]}>{statusLabel[session.status]}</Badge>
              </div>
            </div>
          </Link>
        ))}
        <p className="px-2 pt-1 text-xs text-muted-foreground">
          Full archive in{" "}
          <Link href="/reports" className="text-primary hover:underline">
            <span>Reports</span>
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
