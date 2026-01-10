"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface ChartData {
    date: string;
    count: number;
}

interface StatsChartsProps {
    userGrowth: ChartData[];
    reportActivity: ChartData[];
}

import { useLanguage } from "@/contexts/LanguageContext";

export const StatsCharts = ({ userGrowth, reportActivity }: StatsChartsProps) => {
    const { t } = useLanguage();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>{t("DASHBOARD.CHARTS.USER_GROWTH")}</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={userGrowth}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                                tickFormatter={(date: string) => {
                                    if (!date) return "";
                                    const parts = date.split('-');
                                    if (parts.length === 3) {
                                        const day = parseInt(parts[2]);
                                        const month = parseInt(parts[1]);
                                        if (!isNaN(day) && !isNaN(month)) {
                                            return `${day}/${month}`;
                                        }
                                    }
                                    return date;
                                }}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value: number) => `${value}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                labelFormatter={(label) => {
                                     if (!label) return "";
                                     const parts = label.split('-');
                                     if (parts.length === 3) {
                                         const day = parseInt(parts[2]);
                                         const month = parseInt(parts[1]);
                                         const year = parseInt(parts[0]);
                                         if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                             return `${day}/${month}/${year}`;
                                         }
                                     }
                                     return label;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                                activeDot={{ r: 8 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>{t("DASHBOARD.CHARTS.REPORT_ACTIVITY")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                         <AreaChart data={reportActivity}>
                            <defs>
                                <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                                tickFormatter={(date: string) => {
                                    if (!date) return "";
                                    const parts = date.split('-');
                                    if (parts.length === 3) {
                                        const day = parseInt(parts[2]);
                                        const month = parseInt(parts[1]);
                                        if (!isNaN(day) && !isNaN(month)) {
                                            return `${day}/${month}`;
                                        }
                                    }
                                    return date;
                                }}
                            />
                             <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value: number) => `${value}`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                labelFormatter={(label) => {
                                     if (!label) return "";
                                     const parts = label.split('-');
                                     if (parts.length === 3) {
                                         const day = parseInt(parts[2]);
                                         const month = parseInt(parts[1]);
                                         const year = parseInt(parts[0]);
                                         if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                             return `${day}/${month}/${year}`;
                                         }
                                     }
                                     return label;
                                }}
                            />
                             <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#82ca9d"
                                fillOpacity={1}
                                fill="url(#colorReports)"
                                activeDot={{ r: 8 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
