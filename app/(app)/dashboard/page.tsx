import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, FileBarChart, Percent } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { ScoreTrendChart } from "@/features/dashboard/components/score-trend-chart";
import { RecentMeetings } from "@/features/dashboard/components/recent-meetings";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { dashboardMetrics } from "@/features/dashboard/mock";

const metricIcons = [ClipboardCheck, FileBarChart, Percent, ArrowUpRight];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <SectionHeader
        eyebrow="Overview"
        title="Good morning, Piyush"
        description="Two board sessions are active. Here's where every pitch in motion stands."
        action={
          <Button asChild>
            <Link href="/meeting/new">
              <span>New meeting</span>
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} trend={metric.trend} icon={metricIcons[index]} />
        ))}
      </div>

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ScoreTrendChart />
        <ActivityFeed />
      </div>

      <RecentMeetings />
    </div>
  );
}
