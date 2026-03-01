import React from 'react';
import { X, Mail, Phone, Briefcase, Clock, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGetInterviewsByCandidate, Candidate, CandidateStatus, InterviewStatus } from '../hooks/useQueries';
import AIScoreBadge from './AIScoreBadge';
import { cn } from '@/lib/utils';

interface CandidateDetailProps {
  candidate: Candidate;
  jobs: { id: bigint; title: string }[];
  onClose: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  [CandidateStatus.new_]: 'New',
  [CandidateStatus.screening]: 'Screening',
  [CandidateStatus.shortlisted]: 'Shortlisted',
  [CandidateStatus.interview]: 'Interview',
  [CandidateStatus.offer]: 'Offer',
  [CandidateStatus.hired]: 'Hired',
  [CandidateStatus.rejected]: 'Rejected',
};

const STAGE_COLORS: Record<string, string> = {
  [CandidateStatus.new_]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [CandidateStatus.screening]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [CandidateStatus.shortlisted]: 'bg-amber/10 text-amber border-amber/20',
  [CandidateStatus.interview]: 'bg-teal/10 text-teal border-teal/20',
  [CandidateStatus.offer]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [CandidateStatus.hired]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [CandidateStatus.rejected]: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function CandidateDetail({ candidate, jobs, onClose }: CandidateDetailProps) {
  const { data: interviews } = useGetInterviewsByCandidate(candidate.id);

  const maxScore = candidate.matchScores.length > 0
    ? Math.max(...candidate.matchScores.map(([, s]) => Number(s)))
    : 0;

  const getJobTitle = (jobId: bigint) => {
    return jobs.find((j) => j.id === jobId)?.title || `Job #${jobId}`;
  };

  const formatDate = (ts: bigint) => {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatDateTime = (ts: bigint) => {
    return new Date(Number(ts) / 1_000_000).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-card border-l border-border shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal/20 to-amber/20 flex items-center justify-center text-lg font-bold text-teal font-display">
            {candidate.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">{candidate.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={cn('text-xs border', STAGE_COLORS[candidate.status])}>
                {STAGE_LABELS[candidate.status]}
              </Badge>
              {maxScore > 0 && <AIScoreBadge score={maxScore} size="sm" />}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Contact Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{candidate.experienceYears.toString()} years experience</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* AI Match Scores */}
          {candidate.matchScores.length > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber" />
                  AI Match Scores
                </h3>
                <div className="space-y-2">
                  {candidate.matchScores.map(([jobId, score]) => (
                    <div key={jobId.toString()} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{getJobTitle(jobId)}</span>
                        <AIScoreBadge score={Number(score)} size="sm" />
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-all duration-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Skills */}
          {candidate.skills.length > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs bg-teal/10 text-teal border-teal/20">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Applied Jobs */}
          {candidate.appliedJobIds.length > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applied Jobs</h3>
                <div className="space-y-1">
                  {candidate.appliedJobIds.map((jobId) => (
                    <div key={jobId.toString()} className="flex items-center gap-2 text-sm py-1">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{getJobTitle(jobId)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Pipeline History */}
          {candidate.pipelineLog.length > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Pipeline History
                </h3>
                <div className="space-y-2">
                  {[...candidate.pipelineLog].reverse().map((transition, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{STAGE_LABELS[transition.fromStatus]}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className={cn('text-xs font-medium', STAGE_COLORS[transition.toStatus].split(' ')[1])}>
                          {STAGE_LABELS[transition.toStatus]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{formatDate(transition.timestamp)}</p>
                        {transition.note && (
                          <p className="text-xs text-foreground/70 mt-0.5 italic">"{transition.note}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Interviews */}
          {interviews && interviews.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interviews</h3>
              <div className="space-y-2">
                {interviews.map((iv) => (
                  <div key={iv.id.toString()} className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{iv.interviewType} Interview</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          iv.status === InterviewStatus.completed && 'border-green-500/30 text-green-400',
                          iv.status === InterviewStatus.cancelled && 'border-destructive/30 text-destructive',
                          iv.status === InterviewStatus.scheduled && 'border-teal/30 text-teal',
                        )}
                      >
                        {iv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(iv.dateTime)}</p>
                    <p className="text-xs text-muted-foreground">Interviewer: {iv.interviewer}</p>
                    {iv.notes && <p className="text-xs text-foreground/70 italic">"{iv.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume */}
          {candidate.resume && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resume</h3>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-foreground/70 whitespace-pre-wrap line-clamp-10">{candidate.resume}</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
