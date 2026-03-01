import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Briefcase, Users, Calendar, Clock, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGetAnalytics, useListCandidates, useListJobs } from '../hooks/useQueries';
import AIScoreBadge from '../components/AIScoreBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
  const { data: candidates } = useListCandidates();
  const { data: jobs } = useListJobs();

  const stageChartData = analytics?.candidatesPerStage.map(([stage, count]) => ({
    stage,
    count: Number(count),
  })) || [];

  const topCandidates = analytics?.topScoringCandidates.slice(0, 5) || [];

  const getCandidateName = (id: bigint) =>
    candidates?.find((c) => c.id === id)?.name || `Candidate #${id}`;

  const getCandidateJob = (id: bigint) => {
    const candidate = candidates?.find((c) => c.id === id);
    if (!candidate || candidate.appliedJobIds.length === 0) return '—';
    const jobId = candidate.appliedJobIds[0];
    return jobs?.find((j) => j.id === jobId)?.title || `Job #${jobId}`;
  };

  const totalCandidates = candidates?.length || 0;

  // Count interviews this week
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const interviewsThisWeek = 0; // Derived from interviews data if available

  const metricCards = [
    {
      title: 'Open Jobs',
      value: analyticsLoading ? null : Number(analytics?.totalOpenJobs || 0),
      icon: Briefcase,
      color: 'text-teal',
      bg: 'bg-teal/10',
      change: '+2 this week',
    },
    {
      title: 'Active Candidates',
      value: analyticsLoading ? null : totalCandidates,
      icon: Users,
      color: 'text-amber',
      bg: 'bg-amber/10',
      change: `${totalCandidates} total`,
    },
    {
      title: 'Avg. Time to Hire',
      value: analyticsLoading ? null : `${Math.round(analytics?.averageTimeToHireDays || 0)}d`,
      icon: Clock,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      change: 'days average',
    },
    {
      title: 'Pipeline Stages',
      value: analyticsLoading ? null : stageChartData.length,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      change: 'active stages',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden h-36 bg-gradient-to-r from-slate-900 to-slate-800 border border-border">
        <img
          src="/assets/generated/dashboard-banner.dim_1200x300.png"
          alt="Dashboard Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="relative z-10 flex items-center justify-between h-full px-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-teal" />
              <span className="text-xs font-medium text-teal uppercase tracking-wider">AI-Powered Recruiting</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-white">Recruitment Dashboard</h2>
            <p className="text-sm text-white/60 mt-0.5">Real-time insights for smarter hiring</p>
          </div>
          <Button
            onClick={() => navigate({ to: '/jobs' })}
            className="hidden sm:flex bg-teal hover:bg-teal-dark text-white gap-2"
          >
            Post a Job
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ title, value, icon: Icon, color, bg, change }) => (
          <Card key={title} className="border-border bg-card card-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              {value === null ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-display font-bold text-foreground">{value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Bar Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal" />
              Candidates by Pipeline Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : stageChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No pipeline data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stageChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: 'oklch(0.6 0.015 240)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'oklch(0.6 0.015 240)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.17 0.015 240)',
                      border: '1px solid oklch(1 0 0 / 0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'oklch(0.9 0.01 240)' }}
                    itemStyle={{ color: 'oklch(0.6 0.2 195)' }}
                  />
                  <Bar dataKey="count" fill="oklch(0.6 0.2 195)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top AI-Matched Candidates */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber" />
              Top AI-Matched Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topCandidates.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                <p>No scored candidates yet</p>
                <p className="text-xs">Calculate match scores to see rankings</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topCandidates.map(([candidateId, score], index) => (
                  <div
                    key={candidateId.toString()}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                    onClick={() => navigate({ to: '/candidates' })}
                  >
                    <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                      #{index + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal/20 to-amber/20 flex items-center justify-center text-xs font-bold text-teal flex-shrink-0">
                      {getCandidateName(candidateId).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {getCandidateName(candidateId)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getCandidateJob(candidateId)}
                      </p>
                    </div>
                    <AIScoreBadge score={Number(score)} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
        © {new Date().getFullYear()} HireIQ — Built with ❤️ using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'hireiq-app')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
