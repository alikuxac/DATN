"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChartData {
    date: string;
    count: number;
}

interface HotspotData {
    _id: string;
    count: number;
    name?: string;
}

interface AnalyticsChartsProps {
    rescuesTrend: ChartData[];
    hotspots: HotspotData[];
}

export const AnalyticsCharts = ({ rescuesTrend, hotspots }: AnalyticsChartsProps) => {
    const { t } = useLanguage();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Rescues Trend */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Rescues Trend (Daily)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={rescuesTrend}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                                    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                                    return date;
                                }}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                             <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                cursor={{fill: 'hsl(var(--muted))'}}
                                labelFormatter={(label) => {
                                     if (!label) return "";
                                     const parts = label.split('-');
                                     if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                     return label;
                                }}
                            />
                            <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolved Reports" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Hotspots */}
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Top Hotspots (Regions)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={hotspots} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="_id"
                                type="category"
                                stroke="#888888"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={80}
                                tickFormatter={(val) => val === 'unknown' ? 'Unknown' : (val.length > 10 ? val.substring(0, 10) + '...' : val)}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                cursor={{fill: 'hsl(var(--muted))'}}
                            />
                            <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={32} name="Total Reports">
                                {hotspots.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f97316'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
