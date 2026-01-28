import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportPerformanceStats } from "@/hooks/useStats";
import { formatDuration, intervalToDuration } from "date-fns";
import { Timer, Ambulance, Clock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export function ReportPerformance() {
  const { data: stats, isLoading } = useReportPerformanceStats();
  const { t } = useLanguage();

  if (isLoading) {
    return <PerformanceSkeleton />;
  }

  if (!stats) return null;

  // Helper to format ms to human readable
  const formatMs = (ms: number) => {
    if (!ms) return "N/A";
    const duration = intervalToDuration({ start: 0, end: ms });
    
    // Custom format logic or use date-fns formatDuration
    const parts = [];
    if (duration.hours) parts.push(`${duration.hours}h`);
    if (duration.minutes) parts.push(`${duration.minutes}m`);
    // if (duration.seconds) parts.push(`${duration.seconds}s`);
    if (parts.length === 0) return "< 1m";
    return parts.join(" ");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t("DASHBOARD.PERFORMANCE.TITLE")}</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("DASHBOARD.PERFORMANCE.AVG_RESPONSE_TIME")}
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMs(stats.avgResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              {t("DASHBOARD.PERFORMANCE.CREATION_TO_ACCEPTANCE")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("DASHBOARD.PERFORMANCE.AVG_RESCUE_TIME")}
            </CardTitle>
            <Ambulance className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMs(stats.avgRescueTime)}</div>
            <p className="text-xs text-muted-foreground">
              {t("DASHBOARD.PERFORMANCE.ACCEPTANCE_TO_RESOLUTION")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("DASHBOARD.PERFORMANCE.AVG_TOTAL_TIME")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMs(stats.avgTotalTime)}</div>
            <p className="text-xs text-muted-foreground">
              {t("DASHBOARD.PERFORMANCE.CREATION_TO_RESOLUTION")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("DASHBOARD.PERFORMANCE.COMPLETED_REPORTS")}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground">
              {t("DASHBOARD.PERFORMANCE.TOTAL_RESOLVED")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-[200px]" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
