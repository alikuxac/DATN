"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useSocket } from "@/hooks/useSocket";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users } from "lucide-react";

interface OnlineDataPoint {
    time: string;
    count: number;
    timestamp: number;
}

export const OnlineUserChart = () => {
    const { t } = useLanguage();
    const { on, off } = useSocket();
    const [data, setData] = useState<OnlineDataPoint[]>([]);
    const [currentCount, setCurrentCount] = useState(0);

    useEffect(() => {
        // Initial data point
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setData([{
            time: timeStr,
            count: 0,
            timestamp: now.getTime()
        }]);

        const handleOnlineUpdate = (payload: { count: number }) => {
            const date = new Date();
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setCurrentCount(payload.count);
            
            setData(prev => {
                const newData = [...prev, {
                    time,
                    count: payload.count,
                    timestamp: date.getTime()
                }];
                // Keep last 20 points
                return newData.slice(-20);
            });
        };

        on('stats.online_users', handleOnlineUpdate);

        return () => {
            off('stats.online_users', handleOnlineUpdate);
        };
    }, [on, off]);

    return (
        <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-normal">
                    {t("DASHBOARD.CHARTS.ONLINE_USERS")}
                </CardTitle>
                <div className="flex items-center space-x-2">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-2xl font-bold">{currentCount}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="time" 
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={20}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 'auto']}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                            />
                            <Area
                                isAnimationActive={false}
                                type="monotone"
                                dataKey="count"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorOnline)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
