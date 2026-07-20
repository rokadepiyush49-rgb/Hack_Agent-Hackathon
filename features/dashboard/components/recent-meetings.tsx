import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recentMeetings } from "@/features/dashboard/mock";
import type { RecentMeeting } from "@/features/dashboard/types";

const statusTone: Record<RecentMeeting["status"], "signal" | "success" | "muted"> = {
  "in-progress": "signal",
  completed: "success",
  scheduled: "muted",
};

const statusLabel: Record<RecentMeeting["status"], string> = {
  "in-progress": "In session",
  completed: "Completed",
  scheduled: "Scheduled",
};

export function RecentMeetings() {
  return (
    <Card className="p-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent meetings</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/boardroom">
            <span className="inline-flex items-center gap-2">
              View all
              <ArrowRight />
            </span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {recentMeetings.map((meeting) => (
          <Link
            key={meeting.id}
            href={meeting.status === "completed" ? `/reports/${meeting.id}` : "/boardroom"}
            className="block rounded-lg px-3 py-3 transition-colors hover:bg-surface-elevated"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{meeting.startupName}</p>
                <p className="truncate text-xs text-muted-foreground">{meeting.oneLiner}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {meeting.investmentScore !== undefined && (
                  <span className="font-mono text-sm font-medium text-foreground">{meeting.investmentScore}</span>
                )}
                <Badge tone={statusTone[meeting.status]} pulse={meeting.status === "in-progress"}>
                  {statusLabel[meeting.status]}
                </Badge>
                <span className="hidden text-xs text-muted-foreground sm:block">{meeting.updatedAt}</span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
