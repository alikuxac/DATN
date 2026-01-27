"use client";

import { useDashboardStats } from "@/hooks/useStats";
import { StatsCards } from "@/components/dashboard/overview/StatsCards";
import { StatsCharts } from "@/components/dashboard/overview/StatsCharts";
import { OnlineUserChart } from "@/components/dashboard/overview/OnlineUserChart";
import { AnalyticsCharts } from "@/components/dashboard/overview/AnalyticsCharts";
import { ReportPerformance } from "@/components/dashboard/overview/ReportPerformance";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>{t("DASHBOARD.LOADING")}</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-4 text-red-500">
        {t("DASHBOARD.ERR_LOAD_FAILED")}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t("DASHBOARD.OVERVIEW")}</h2>
      <StatsCards stats={stats} />
      <OnlineUserChart />
      <StatsCharts 
        userGrowth={stats.charts.users} 
        reportActivity={stats.charts.reports} 
      />

      {(stats.charts.rescuesTrend || stats.charts.hotspots) && (
        <AnalyticsCharts 
          rescuesTrend={stats.charts.rescuesTrend || []} 
          hotspots={stats.charts.hotspots || []} 
        />
      )}
      
      <ReportPerformance />
    </div>
  );
}
