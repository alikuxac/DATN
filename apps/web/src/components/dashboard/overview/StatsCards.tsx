"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, FileText, CheckCircle } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    description: string;
}

const StatCard = ({ title, value, icon: Icon, description, diff }: StatsCardProps & { diff?: number }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {typeof diff === 'number' && (
                        <span className={`mr-2 font-bold ${
                            diff > 0 ? "text-green-500" : 
                            diff < 0 ? "text-red-500" : 
                            "text-foreground"
                        }`}>
                            {diff > 0 ? "+" : ""}{diff}
                        </span>
                    )}
                    <span className="truncate">{description}</span>
                </div>
            </CardContent>
        </Card>
    );
};

interface DashboardStatsCardsProps {
    stats: {
        users: { total: number; active: number; diff: number };
        reports: { total: number; resolved: number; diff: number };
    };
}

import { useLanguage } from "@/contexts/LanguageContext";

export const StatsCards = ({ stats }: DashboardStatsCardsProps) => {
    const { t } = useLanguage();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title={t("DASHBOARD.STATS.TOTAL_USERS")}
                value={stats.users.total}
                icon={Users}
                description={t("DASHBOARD.STATS.TOTAL_USERS_DESC")}
                diff={stats.users.diff}
            />
            <StatCard
                title={t("DASHBOARD.STATS.ACTIVE_USERS")}
                value={stats.users.active}
                icon={UserCheck}
                description={t("DASHBOARD.STATS.ACTIVE_USERS_DESC")}
            />
            <StatCard
                title={t("DASHBOARD.STATS.TOTAL_REPORTS")}
                value={stats.reports.total}
                icon={FileText}
                description={t("DASHBOARD.STATS.TOTAL_REPORTS_DESC")}
                diff={stats.reports.diff}
            />
            <StatCard
                title={t("DASHBOARD.STATS.RESOLVED_REPORTS")}
                value={stats.reports.resolved}
                icon={CheckCircle}
                description={t("DASHBOARD.STATS.RESOLVED_REPORTS_DESC")}
            />
        </div>
    );
};
