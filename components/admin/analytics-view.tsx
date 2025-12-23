"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminChat } from "@/hooks/use-admin-chat"
import { format, subDays, startOfDay, isSameDay, getHours } from "date-fns"
import { Users, MessageSquare, TrendingUp, Calendar, Clock } from "lucide-react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts"

export function AnalyticsView() {
    const { conversations, isLoading } = useAdminChat()

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>
    }

    // --- KPI Metrics ---
    const totalVisitors = conversations.length
    const totalMessages = conversations.reduce((acc, c) => acc + c.messages.length, 0)
    const avgMessages = totalVisitors > 0 ? Math.round(totalMessages / totalVisitors) : 0

    // --- Chart 1: Visitor Trends (Last 30 Days) ---
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        return subDays(startOfDay(new Date()), 29 - i)
    })

    const trendData = last30Days.map(day => {
        // Count conversations created on this day
        const count = conversations.filter(c => isSameDay(new Date(c.created_at), day)).length
        return {
            date: format(day, "MMM d"),
            visitors: count
        }
    })

    // --- Chart 2: Hourly Activity Heatmap (Aggregate of all time) ---
    const hours = Array.from({ length: 24 }, (_, i) => i) // 0 to 23
    const activityData = hours.map(hour => {
        // Count all messages sent during this hour of the day (regardless of date)
        const count = conversations.flatMap(c => c.messages)
            .filter(m => getHours(new Date(m.created_at)) === hour)
            .length

        return {
            hour: format(new Date().setHours(hour), "ha"), // "1pm"
            messages: count
        }
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">
                    <Calendar className="h-4 w-4" /> Last 30 Days
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVisitors}</div>
                        <p className="text-xs text-muted-foreground">Unique sessions recorded</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMessages}</div>
                        <p className="text-xs text-muted-foreground">Messages sent and received</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgMessages}</div>
                        <p className="text-xs text-muted-foreground">Avg. messages per session</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Main Graph: Visitor Trend (4/7) */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visitor Growth</CardTitle>
                        <CardDescription>Daily new conversations over the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                        allowDecimals={false}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="visitors"
                                        stroke="#8884d8"
                                        fillOpacity={1}
                                        fill="url(#colorVisitors)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Graph: Peak Hours (3/7) */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Peak Activity Hours</CardTitle>
                        <CardDescription>Aggregate message volume by time of day</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData}>
                                    <XAxis
                                        dataKey="hour"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={3} // Show every 3rd hour to avoid crowding
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    />
                                    <Bar dataKey="messages" fill="#faad14" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
