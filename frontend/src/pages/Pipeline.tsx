import React, { useState, useMemo } from 'react';
import { GitBranch, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useListCandidates,
  useListJobs,
  useMoveCandidateStage,
  Candidate,
  CandidateStatus,
} from '../hooks/useQueries';
import AIScoreBadge from '../components/AIScoreBadge';
import CandidateDetail from '../components/CandidateDetail';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STAGES: { key: CandidateStatus; label: string; color: string; bg: string }[] = [
  { key: CandidateStatus.new_, label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { key: CandidateStatus.screening, label: 'Screening', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: CandidateStatus.shortlisted, label: 'Shortlisted', color: 'text-amber', bg: 'bg-amber/10 border-amber/20' },
  { key: CandidateStatus.interview, label: 'Interview', color: 'text-teal', bg: 'bg-teal/10 border-teal/20' },
  { key: CandidateStatus.offer, label: 'Offer', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { key: CandidateStatus.hired, label: 'Hired', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { key: CandidateStatus.rejected, label: 'Rejected', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
];

interface MoveDialogState {
  candidate: Candidate;
  targetStage: CandidateStatus;
}

export default function Pipeline() {
  const { data: candidates, isLoading } = useListCandidates();
  const { data: jobs } = useListJobs();
  const moveStage = useMoveCandidateStage();

  const [jobFilter, setJobFilter] = useState<string>('all');
  const [moveDialog, setMoveDialog] = useState<MoveDialogState | null>(null);
  const [moveNote, setMoveNote] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    if (jobFilter === 'all') return candidates;
    const jobId = BigInt(jobFilter);
    return candidates.filter((c) => c.appliedJobIds.some((id) => id === jobId));
  }, [candidates, jobFilter]);

  const candidatesByStage = useMemo(() => {
    const map: Record<string, Candidate[]> = {};
    STAGES.forEach((s) => { map[s.key] = []; });
    filteredCandidates.forEach((c) => {
      if (map[c.status]) map[c.status].push(c);
    });
    return map;
  }, [filteredCandidates]);

  const getMaxScore = (c: Candidate) => {
    if (c.matchScores.length === 0) return 0;
    return Math.max(...c.matchScores.map(([, s]) => Number(s)));
  };

  const getJobTitle = (jobId: bigint) =>
    jobs?.find((j) => j.id === jobId)?.title || `Job #${jobId}`;

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    setDraggedId(candidateId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const handleDrop = (e: React.DragEvent, targetStage: CandidateStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedId) return;

    const candidate = candidates?.find((c) => c.id.toString() === draggedId);
    if (!candidate || candidate.status === targetStage) {
      setDraggedId(null);
      return;
    }

    setMoveDialog({ candidate, targetStage });
    setMoveNote('');
    setDraggedId(null);
  };

  const handleMoveConfirm = async () => {
    if (!moveDialog) return;
    try {
      await moveStage.mutateAsync({
        candidateId: moveDialog.candidate.id,
        newStatus: moveDialog.targetStage,
        note: moveNote,
      });
      toast.success(`Moved to ${STAGES.find((s) => s.key === moveDialog.targetStage)?.label}`);
      setMoveDialog(null);
      setMoveNote('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg.includes('Unauthorized') ? 'Access denied' : msg);
    }
  };

  const jobsForDetail = (jobs || []).map((j) => ({ id: j.id, title: j.title }));

  return (
    <div className="p-4 lg:p-6 space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Pipeline Board</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag candidates between stages to update their status
          </p>
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {(jobs || []).map((j) => (
              <SelectItem key={j.id.toString()} value={j.id.toString()}>
                {j.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((s) => (
            <div key={s.key} className="flex-shrink-0 w-56">
              <Skeleton className="h-8 w-full mb-3" />
              <Skeleton className="h-24 w-full mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {STAGES.map((stage) => {
            const stageCandidates = candidatesByStage[stage.key] || [];
            const isDragTarget = dragOverStage === stage.key;

            return (
              <div
                key={stage.key}
                className={cn(
                  'flex-shrink-0 w-56 flex flex-col rounded-xl border transition-all duration-150',
                  isDragTarget
                    ? 'border-teal/50 bg-teal/5 shadow-teal'
                    : 'border-border bg-card/50'
                )}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', stage.color)}>{stage.label}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-xs h-5 px-1.5', stage.bg)}>
                    {stageCandidates.length}
                  </Badge>
                </div>

                {/* Cards */}
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {stageCandidates.map((candidate) => {
                      const maxScore = getMaxScore(candidate);
                      return (
                        <div
                          key={candidate.id.toString()}
                          draggable
                          onDragStart={(e) => handleDragStart(e, candidate.id.toString())}
                          onClick={() => setSelectedCandidate(candidate)}
                          className={cn(
                            'p-2.5 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing',
                            'hover:border-teal/30 hover:shadow-sm transition-all duration-150',
                            draggedId === candidate.id.toString() && 'opacity-50'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal/20 to-amber/20 flex items-center justify-center text-[10px] font-bold text-teal flex-shrink-0">
                              {candidate.name.charAt(0)}
                            </div>
                            <p className="text-xs font-medium text-foreground truncate flex-1">
                              {candidate.name}
                            </p>
                          </div>

                          {candidate.appliedJobIds.length > 0 && (
                            <p className="text-[10px] text-muted-foreground truncate mb-1.5">
                              {getJobTitle(candidate.appliedJobIds[0])}
                            </p>
                          )}

                          {maxScore > 0 && (
                            <div className="flex items-center gap-1.5">
                              <AIScoreBadge score={maxScore} size="sm" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {stageCandidates.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/40">
                        <GitBranch className="w-5 h-5 mb-1" />
                        <p className="text-[10px]">Drop here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}

      {/* Move Confirmation Dialog */}
      <Dialog open={!!moveDialog} onOpenChange={(v) => !v && setMoveDialog(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Move Candidate</DialogTitle>
            <DialogDescription>
              Move <strong>{moveDialog?.candidate.name}</strong> to{' '}
              <strong>{STAGES.find((s) => s.key === moveDialog?.targetStage)?.label}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Note (optional)
              </Label>
              <Textarea
                value={moveNote}
                onChange={(e) => setMoveNote(e.target.value)}
                placeholder="Add a note about this stage change..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMoveDialog(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleMoveConfirm}
                disabled={moveStage.isPending}
                className="flex-1 bg-teal hover:bg-teal-dark text-white"
              >
                {moveStage.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Panel */}
      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate}
          jobs={jobsForDetail}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
