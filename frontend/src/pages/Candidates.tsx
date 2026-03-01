import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Users, Sparkles, Edit, Trash2, MoreHorizontal, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useListCandidates,
  useListJobs,
  useDeleteCandidate,
  useCalculateMatchScore,
  Candidate,
  CandidateStatus,
} from '../hooks/useQueries';
import CandidateForm from '../components/CandidateForm';
import CandidateDetail from '../components/CandidateDetail';
import AIScoreBadge from '../components/AIScoreBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STAGE_COLORS: Record<string, string> = {
  [CandidateStatus.new_]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [CandidateStatus.screening]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [CandidateStatus.shortlisted]: 'bg-amber/10 text-amber border-amber/20',
  [CandidateStatus.interview]: 'bg-teal/10 text-teal border-teal/20',
  [CandidateStatus.offer]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [CandidateStatus.hired]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [CandidateStatus.rejected]: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STAGE_LABELS: Record<string, string> = {
  [CandidateStatus.new_]: 'New',
  [CandidateStatus.screening]: 'Screening',
  [CandidateStatus.shortlisted]: 'Shortlisted',
  [CandidateStatus.interview]: 'Interview',
  [CandidateStatus.offer]: 'Offer',
  [CandidateStatus.hired]: 'Hired',
  [CandidateStatus.rejected]: 'Rejected',
};

export default function Candidates() {
  const { data: candidates, isLoading } = useListCandidates();
  const { data: jobs } = useListJobs();
  const deleteCandidate = useDeleteCandidate();
  const calcScore = useCalculateMatchScore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const filtered = useMemo(() => {
    return (candidates || []).filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [candidates, search, statusFilter]);

  const getMaxScore = (c: Candidate) => {
    if (c.matchScores.length === 0) return 0;
    return Math.max(...c.matchScores.map(([, s]) => Number(s)));
  };

  const getJobTitle = (jobId: bigint) =>
    jobs?.find((j) => j.id === jobId)?.title || `Job #${jobId}`;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCandidate.mutateAsync(deleteId);
      toast.success('Candidate deleted');
      if (selectedCandidate?.id === deleteId) setSelectedCandidate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg.includes('Unauthorized') ? 'Admin access required' : msg);
    } finally {
      setDeleteId(null);
    }
  };

  const handleCalcScore = async (candidate: Candidate) => {
    if (candidate.appliedJobIds.length === 0) {
      toast.error('Candidate has no applied jobs');
      return;
    }
    try {
      for (const jobId of candidate.appliedJobIds) {
        await calcScore.mutateAsync({ candidateId: candidate.id, jobId });
      }
      toast.success('Match scores calculated');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg);
    }
  };

  const jobsForDetail = (jobs || []).map((j) => ({ id: j.id, title: j.title }));

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Candidates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {candidates?.length || 0} candidates
          </p>
        </div>
        <Button
          onClick={() => { setEditCandidate(null); setFormOpen(true); }}
          className="bg-teal hover:bg-teal-dark text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Candidate</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Candidates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No candidates found</p>
          <p className="text-sm mt-1">
            {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first candidate'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((candidate) => {
            const maxScore = getMaxScore(candidate);
            return (
              <Card
                key={candidate.id.toString()}
                className="border-border bg-card card-hover group cursor-pointer"
                onClick={() => setSelectedCandidate(candidate)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal/20 to-amber/20 flex items-center justify-center text-sm font-bold text-teal flex-shrink-0">
                        {candidate.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCandidate(candidate);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCalcScore(candidate);
                          }}
                        >
                          <Calculator className="w-3.5 h-3.5 mr-2" />
                          Calculate AI Score
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(candidate.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={cn('text-xs border', STAGE_COLORS[candidate.status])}>
                      {STAGE_LABELS[candidate.status]}
                    </Badge>
                    {maxScore > 0 && <AIScoreBadge score={maxScore} size="sm" />}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{candidate.experienceYears.toString()} yrs exp</span>
                    <span>{candidate.skills.length} skills</span>
                  </div>

                  {maxScore > 0 && (
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-all duration-500"
                        style={{ width: `${maxScore}%` }}
                      />
                    </div>
                  )}

                  {candidate.appliedJobIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground truncate">
                        Applied: {getJobTitle(candidate.appliedJobIds[0])}
                        {candidate.appliedJobIds.length > 1 && ` +${candidate.appliedJobIds.length - 1}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Forms & Panels */}
      <CandidateForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCandidate(null); }}
        editCandidate={editCandidate}
      />

      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate}
          jobs={jobsForDetail}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
