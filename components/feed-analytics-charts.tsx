'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Activity, Zap, Clock } from 'lucide-react'

interface FeedAnalyticsChartsProps {
    symbol: string
    currentPulse: number
    averageAccuracy: number
    updatesToday: number
}

type TimeRange = '1D' | '1W' | '1M'

// Generate mock pulse history data
function generatePulseHistory(range: TimeRange, currentPulse: number) {
    const points = range === '1D' ? 24 : range === '1W' ? 7 * 24 : 30 * 24
    const data = []
    let pulse = currentPulse - 10 + Math.random() * 20 // Start near current

    for (let i = 0; i < points; i++) {
        pulse += (Math.random() - 0.5) * 4 // Random walk
        pulse = Math.max(30, Math.min(100, pulse)) // Clamp 30-100

        let label = ''
        if (range === '1D') {
            label = `${Math.floor(i)}h`
        } else if (range === '1W') {
            const day = Math.floor(i / 24)
            label = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day % 7]
        } else {
            const day = Math.floor(i / 24)
            label = `Day ${day + 1}`
        }

        // Only add every nth point to keep chart clean
        const interval = range === '1D' ? 2 : range === '1W' ? 24 : 72
        if (i % interval === 0) {
            data.push({
                time: label,
                pulse: Math.round(pulse),
            })
        }
    }

    return data
}

// Generate hourly update frequency data
function generateUpdateFrequency() {
    const data = []
    const now = new Date()

    for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
        const updates = Math.floor(20 + Math.random() * 40) // 20-60 updates per hour

        data.push({
            hour: hour.getHours() + ':00',
            updates,
        })
    }

    return data
}

export function FeedAnalyticsCharts({ symbol, currentPulse, averageAccuracy, updatesToday }: FeedAnalyticsChartsProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>('1D')
    const pulseHistory = generatePulseHistory(timeRange, currentPulse)
    const updateFrequency = generateUpdateFrequency()

    // Calculate pulse change from start to current
    const pulseChange = pulseHistory.length > 0
        ? ((currentPulse - pulseHistory[0].pulse) / pulseHistory[0].pulse * 100).toFixed(2)
        : '0.00'
    const isPositive = parseFloat(pulseChange) >= 0

    return (
        <div className="space-y-6">
            {/* Historical Pulse Chart - Chainlink Style */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg mb-1">Social Pulse History</CardTitle>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-bold">{currentPulse}/100</span>
                                <Badge variant={isPositive ? 'default' : 'destructive'} className="text-sm">
                                    {isPositive ? '+' : ''}{pulseChange}%
                                </Badge>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {(['1D', '1W', '1M'] as TimeRange[]).map((range) => (
                                <Button
                                    key={range}
                                    variant={timeRange === range ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTimeRange(range)}
                                    className="text-xs h-8 px-3"
                                >
                                    {range}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={pulseHistory}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="time"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <YAxis
                                domain={[30, 100]}
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="pulse"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Update Frequency Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-accent" />
                        <CardTitle className="text-lg">Update Frequency (24h)</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {updatesToday} updates today • Avg {Math.round(updatesToday / 24)} per hour
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={updateFrequency}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="hour"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                interval={3}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }}
                            />
                            <Bar
                                dataKey="updates"
                                fill="hsl(var(--accent))"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Feed Health Metrics - Chainlink Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Accuracy Rate</p>
                                <p className="text-2xl font-bold">{averageAccuracy}%</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {averageAccuracy >= 95 ? 'Excellent' : averageAccuracy >= 90 ? 'Good' : 'Fair'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Avg Update Time</p>
                                <p className="text-2xl font-bold">3.2min</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Fast response
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Feed Status</p>
                                <p className="text-2xl font-bold">Active</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {updatesToday > 500 ? 'High activity' : 'Normal activity'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
