import React, { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, Briefcase } from 'lucide-react';
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
  useListJobs,
  useUpdateJobStatus,
  useDeleteJob,
  JobRequisition,
  JobStatus,
  JobType,
} from '../hooks/useQueries';
import JobForm from '../components/JobForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  [JobStatus.open]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [JobStatus.draft]: 'bg-muted text-muted-foreground border-border',
  [JobStatus.closed]: 'bg-destructive/10 text-destructive border-destructive/20',
  [JobStatus.onHold]: 'bg-amber/10 text-amber border-amber/20',
};

const JOB_TYPE_LABELS: Record<string, string> = {
  [JobType.fullTime]: 'Full Time',
  [JobType.partTime]: 'Part Time',
  [JobType.contract]: 'Contract',
};

export default function Jobs() {
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useListJobs();
  const updateStatus = useUpdateJobStatus();
  const deleteJob = useDeleteJob();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobRequisition | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const departments = useMemo(() => {
    const depts = new Set(jobs?.map((j) => j.department) || []);
    return Array.from(depts).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    return (jobs || []).filter((j) => {
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.department.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      const matchDept = deptFilter === 'all' || j.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [jobs, search, statusFilter, deptFilter]);

  const handleStatusChange = async (job: JobRequisition, status: JobStatus) => {
    try {
      await updateStatus.mutateAsync({ id: job.id, status });
      toast.success(`Job status updated to ${status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg.includes('Unauthorized') ? 'Admin access required' : msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteJob.mutateAsync(deleteId);
      toast.success('Job deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg.includes('Unauthorized') ? 'Admin access required' : msg);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Job Requisitions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {jobs?.length || 0} jobs
          </p>
        </div>
        <Button
          onClick={() => { setEditJob(null); setFormOpen(true); }}
          className="bg-teal hover:bg-teal-dark text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Post Job</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={JobStatus.open}>Open</SelectItem>
            <SelectItem value={JobStatus.draft}>Draft</SelectItem>
            <SelectItem value={JobStatus.closed}>Closed</SelectItem>
            <SelectItem value={JobStatus.onHold}>On Hold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Briefcase className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm mt-1">
            {search || statusFilter !== 'all' || deptFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Post your first job to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <Card key={job.id.toString()} className="border-border bg-card card-hover group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{job.department}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate({ to: '/pipeline', search: { jobId: job.id.toString() } as Record<string, string> })}>
                        <Eye className="w-3.5 h-3.5 mr-2" />
                        View Candidates
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditJob(job); setFormOpen(true); }}>
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Edit Job
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {job.status !== JobStatus.open && (
                        <DropdownMenuItem onClick={() => handleStatusChange(job, JobStatus.open)}>
                          Set Open
                        </DropdownMenuItem>
                      )}
                      {job.status !== JobStatus.closed && (
                        <DropdownMenuItem onClick={() => handleStatusChange(job, JobStatus.closed)}>
                          Set Closed
                        </DropdownMenuItem>
                      )}
                      {job.status !== JobStatus.onHold && (
                        <DropdownMenuItem onClick={() => handleStatusChange(job, JobStatus.onHold)}>
                          Set On Hold
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(job.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge className={cn('text-xs border', STATUS_COLORS[job.status])}>
                    {job.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {job.experienceLevel.toString()}+ yrs
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{job.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{job.location}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-teal hover:text-teal hover:bg-teal/10 gap-1"
                    onClick={() => navigate({ to: '/pipeline' })}
                  >
                    <Eye className="w-3 h-3" />
                    Candidates
                  </Button>
                </div>

                {job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border">
                    {job.requiredSkills.slice(0, 3).map((skill) => (
                      <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-teal/10 text-teal">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{job.requiredSkills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <JobForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditJob(null); }}
        editJob={editJob}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The job requisition will be permanently deleted.
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
