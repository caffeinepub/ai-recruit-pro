import React from 'react';
import { TrendingUp, Users, Briefcase, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { useGetAnalytics, useListCandidates, useListJobs } from '../hooks/useQueries';

const COLORS = [
  'oklch(0.6 0.2 195)',
  'oklch(0.75 0.18 75)',
  'oklch(0.65 0.2 145)',
  'oklch(0.7 0.2 30)',
  'oklch(0.65 0.22 280)',
  'oklch(0.6 0.18 220)',
  'oklch(0.7 0.15 60)',
];

export default function Analytics() {
  const { data: analytics, isLoading } = useGetAnalytics();
  const { data: candidates } = useListCandidates();
  const { data: jobs } = useListJobs();

  // Applications over time (last 30 days)
  const applicationsOverTime = React.useMemo(() => {
    if (!candidates) return [];
    const now = Date.now();
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[key] = 0;
    }
    candidates.forEach((c) => {
      const d = new Date(Number(c.createdAt) / 1_000_000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [candidates]);

  // Top jobs by application volume
  const topJobsByVolume = React.useMemo(() => {
    if (!analytics || !jobs) return [];
    return analytics.totalCandidatesPerJob
      .map(([jobId, count]) => ({
        name: jobs.find((j) => j.id === jobId)?.title || `Job #${jobId}`,
        count: Number(count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [analytics, jobs]);

  // Stage distribution for pie chart
  const stageData = React.useMemo(() => {
    if (!analytics) return [];
    return analytics.candidatesPerStage
      .filter(([, count]) => Number(count) > 0)
      .map(([stage, count]) => ({ name: stage, value: Number(count) }));
  }, [analytics]);

  const tooltipStyle = {
    backgroundColor: 'oklch(0.17 0.015 240)',
    border: '1px solid oklch(1 0 0 / 0.1)',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real-time recruitment insights and metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Open Jobs',
            value: isLoading ? null : Number(analytics?.totalOpenJobs || 0),
            icon: Briefcase,
            color: 'text-teal',
            bg: 'bg-teal/10',
          },
          {
            label: 'Total Candidates',
            value: isLoading ? null : candidates?.length || 0,
            icon: Users,
            color: 'text-amber',
            bg: 'bg-amber/10',
          },
          {
            label: 'Avg. Time to Hire',
            value: isLoading ? null : `${Math.round(analytics?.averageTimeToHireDays || 0)}d`,
            icon: Clock,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
          {
            label: 'Top Score',
            value: isLoading
              ? null
              : analytics?.topScoringCandidates[0]
              ? `${Number(analytics.topScoringCandidates[0][1])}%`
              : '—',
            icon: Sparkles,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border bg-card">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              {value === null ? (
                <Skeleton className="h-7 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-display font-bold text-foreground">{value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Over Time */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal" />
              Applications (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!candidates ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={applicationsOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: 'oklch(0.6 0.015 240)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'oklch(0.6 0.015 240)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'oklch(0.9 0.01 240)' }} itemStyle={{ color: 'oklch(0.6 0.2 195)' }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="oklch(0.6 0.2 195)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: 'oklch(0.6 0.2 195)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Stage Distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-amber" />
              Pipeline Stage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : stageData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No candidate data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ fontSize: '11px', color: 'oklch(0.7 0.01 240)' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Jobs by Volume */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal" />
              Top Jobs by Application Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : topJobsByVolume.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No application data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topJobsByVolume} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: 'oklch(0.6 0.015 240)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'oklch(0.6 0.015 240)' }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="oklch(0.75 0.18 75)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Stage Counts Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber" />
              Stage Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {(analytics?.candidatesPerStage || []).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{stage}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal to-amber"
                          style={{
                            width: `${Math.min(100, (Number(count) / Math.max(1, candidates?.length || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-6 text-right">
                        {Number(count)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
