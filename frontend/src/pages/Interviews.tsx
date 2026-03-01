import React, { useState, useMemo } from 'react';
import { Plus, Calendar, List, Clock, Video, Phone, MapPin, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useListCandidates,
  useListJobs,
  useGetInterviewsByCandidate,
  useUpdateInterview,
  Interview,
  InterviewStatus,
  InterviewType,
} from '../hooks/useQueries';
import InterviewForm from '../components/InterviewForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [InterviewType.video]: <Video className="w-3.5 h-3.5" />,
  [InterviewType.phone]: <Phone className="w-3.5 h-3.5" />,
  [InterviewType.onSite]: <MapPin className="w-3.5 h-3.5" />,
};

const STATUS_COLORS: Record<string, string> = {
  [InterviewStatus.scheduled]: 'bg-teal/10 text-teal border-teal/20',
  [InterviewStatus.completed]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [InterviewStatus.cancelled]: 'bg-destructive/10 text-destructive border-destructive/20',
};

function AllInterviews() {
  const { data: candidates } = useListCandidates();
  const { data: jobs } = useListJobs();
  const updateInterview = useUpdateInterview();

  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [editInterview, setEditInterview] = useState<Interview | null>(null);

  // Aggregate all interviews from all candidates
  const [allInterviews, setAllInterviews] = useState<Interview[]>([]);
  const [loadedCandidateIds, setLoadedCandidateIds] = useState<Set<string>>(new Set());

  // We use a component per candidate to load their interviews
  const getCandidateName = (id: bigint) =>
    candidates?.find((c) => c.id === id)?.name || `Candidate #${id}`;
  const getJobTitle = (id: bigint) =>
    jobs?.find((j) => j.id === id)?.title || `Job #${id}`;

  const formatDateTime = (ts: bigint) => {
    const d = new Date(Number(ts) / 1_000_000);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      full: d,
    };
  };

  const isUpcoming = (ts: bigint) => {
    return Number(ts) / 1_000_000 > Date.now();
  };

  const handleStatusUpdate = async (interview: Interview, status: InterviewStatus) => {
    try {
      await updateInterview.mutateAsync({
        id: interview.id,
        dateTime: interview.dateTime,
        interviewer: interview.interviewer,
        interviewType: interview.interviewType as InterviewType,
        status,
        notes: interview.notes,
      });
      toast.success(`Interview marked as ${status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg);
    }
  };

  // Calendar view: group by date
  const calendarGroups = useMemo(() => {
    const groups: Record<string, Interview[]> = {};
    allInterviews.forEach((iv) => {
      const d = new Date(Number(iv.dateTime) / 1_000_000);
      const key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(iv);
    });
    return Object.entries(groups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [allInterviews]);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Interviews</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Schedule and manage interview sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-6 px-2 text-xs gap-1">
                <List className="w-3 h-3" /> List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="h-6 px-2 text-xs gap-1">
                <Calendar className="w-3 h-3" /> Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={() => { setEditInterview(null); setFormOpen(true); }}
            className="bg-teal hover:bg-teal-dark text-white gap-2 h-8 text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Schedule</span>
          </Button>
        </div>
      </div>

      {/* Load interviews for each candidate */}
      {(candidates || []).map((c) => (
        <CandidateInterviewLoader
          key={c.id.toString()}
          candidateId={c.id}
          onLoaded={(ivs) => {
            const idStr = c.id.toString();
            if (!loadedCandidateIds.has(idStr)) {
              setLoadedCandidateIds((prev) => new Set([...prev, idStr]));
              setAllInterviews((prev) => {
                const existingIds = new Set(prev.map((i) => i.id.toString()));
                const newOnes = ivs.filter((i) => !existingIds.has(i.id.toString()));
                return [...prev, ...newOnes];
              });
            }
          }}
        />
      ))}

      {view === 'list' ? (
        <div className="space-y-3">
          {allInterviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Calendar className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No interviews scheduled</p>
              <p className="text-sm mt-1">Schedule your first interview to get started</p>
            </div>
          ) : (
            [...allInterviews]
              .sort((a, b) => Number(b.dateTime) - Number(a.dateTime))
              .map((iv) => {
                const { date, time, full } = formatDateTime(iv.dateTime);
                const upcoming = isUpcoming(iv.dateTime);
                return (
                  <Card
                    key={iv.id.toString()}
                    className={cn(
                      'border-border bg-card',
                      upcoming && iv.status === InterviewStatus.scheduled && 'border-teal/20'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                            upcoming && iv.status === InterviewStatus.scheduled
                              ? 'bg-teal/15 text-teal'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {TYPE_ICONS[iv.interviewType] || <Calendar className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground">
                                {getCandidateName(iv.candidateId)}
                              </p>
                              {upcoming && iv.status === InterviewStatus.scheduled && (
                                <Badge className="text-[10px] bg-teal/10 text-teal border-teal/20 border">
                                  Upcoming
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{getJobTitle(iv.jobId)}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {date} at {time}
                              </span>
                              <span>Interviewer: {iv.interviewer}</span>
                            </div>
                            {iv.notes && (
                              <p className="text-xs text-muted-foreground/70 mt-1 italic">"{iv.notes}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={cn('text-xs border', STATUS_COLORS[iv.status])}>
                            {iv.status}
                          </Badge>
                          {iv.status === InterviewStatus.scheduled && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-green-400 hover:bg-green-500/10"
                                onClick={() => handleStatusUpdate(iv, InterviewStatus.completed)}
                                title="Mark completed"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleStatusUpdate(iv, InterviewStatus.cancelled)}
                                title="Cancel"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                onClick={() => { setEditInterview(iv); setFormOpen(true); }}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {calendarGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Calendar className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No interviews to display</p>
            </div>
          ) : (
            calendarGroups.map(([dateLabel, ivs]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground px-2">{dateLabel}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-teal/20">
                  {ivs.map((iv) => {
                    const { time } = formatDateTime(iv.dateTime);
                    return (
                      <div key={iv.id.toString()} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <span className="text-xs font-mono text-muted-foreground w-14 flex-shrink-0">{time}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{getCandidateName(iv.candidateId)}</p>
                          <p className="text-xs text-muted-foreground">{getJobTitle(iv.jobId)} · {iv.interviewer}</p>
                        </div>
                        <Badge className={cn('text-xs border flex-shrink-0', STATUS_COLORS[iv.status])}>
                          {iv.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <InterviewForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditInterview(null); }}
        candidates={candidates || []}
        jobs={jobs || []}
        editInterview={editInterview}
      />
    </div>
  );
}

function CandidateInterviewLoader({
  candidateId,
  onLoaded,
}: {
  candidateId: bigint;
  onLoaded: (interviews: Interview[]) => void;
}) {
  const { data } = useGetInterviewsByCandidate(candidateId);
  const calledRef = React.useRef(false);

  React.useEffect(() => {
    if (data && !calledRef.current) {
      calledRef.current = true;
      onLoaded(data);
    }
  }, [data, onLoaded]);

  return null;
}

export default AllInterviews;
