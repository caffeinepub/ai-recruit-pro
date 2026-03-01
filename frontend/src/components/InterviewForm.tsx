import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  useCreateInterview,
  useUpdateInterview,
  Candidate,
  JobRequisition,
  Interview,
  InterviewType,
  InterviewStatus,
} from '../hooks/useQueries';
import { toast } from 'sonner';

interface InterviewFormProps {
  open: boolean;
  onClose: () => void;
  candidates: Candidate[];
  jobs: JobRequisition[];
  editInterview?: Interview | null;
  defaultCandidateId?: bigint;
  defaultJobId?: bigint;
}

export default function InterviewForm({
  open,
  onClose,
  candidates,
  jobs,
  editInterview,
  defaultCandidateId,
  defaultJobId,
}: InterviewFormProps) {
  const createInterview = useCreateInterview();
  const updateInterview = useUpdateInterview();

  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>(InterviewType.video);
  const [status, setStatus] = useState<InterviewStatus>(InterviewStatus.scheduled);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editInterview) {
      setCandidateId(editInterview.candidateId.toString());
      setJobId(editInterview.jobId.toString());
      const dt = new Date(Number(editInterview.dateTime) / 1_000_000);
      setDateTime(dt.toISOString().slice(0, 16));
      setInterviewer(editInterview.interviewer);
      setInterviewType(editInterview.interviewType as InterviewType);
      setStatus(editInterview.status as InterviewStatus);
      setNotes(editInterview.notes);
    } else {
      setCandidateId(defaultCandidateId?.toString() || '');
      setJobId(defaultJobId?.toString() || '');
      setDateTime('');
      setInterviewer('');
      setInterviewType(InterviewType.video);
      setStatus(InterviewStatus.scheduled);
      setNotes('');
    }
  }, [editInterview, open, defaultCandidateId, defaultJobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !jobId || !dateTime || !interviewer) {
      toast.error('Please fill in all required fields');
      return;
    }

    const dateTimeMs = new Date(dateTime).getTime();
    const dateTimeNs = BigInt(dateTimeMs) * BigInt(1_000_000);

    try {
      if (editInterview) {
        await updateInterview.mutateAsync({
          id: editInterview.id,
          dateTime: dateTimeNs,
          interviewer,
          interviewType,
          status,
          notes,
        });
        toast.success('Interview updated');
      } else {
        await createInterview.mutateAsync({
          candidateId: BigInt(candidateId),
          jobId: BigInt(jobId),
          dateTime: dateTimeNs,
          interviewer,
          interviewType,
          notes,
        });
        toast.success('Interview scheduled');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg.includes('Unauthorized') ? 'Access denied' : msg);
    }
  };

  const isLoading = createInterview.isPending || updateInterview.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editInterview ? 'Edit Interview' : 'Schedule Interview'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {editInterview ? 'Update interview details.' : 'Schedule a new interview session.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Candidate *</Label>
            <Select value={candidateId} onValueChange={setCandidateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select candidate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Job *</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id.toString()} value={j.id.toString()}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InterviewType.phone}>Phone</SelectItem>
                  <SelectItem value={InterviewType.video}>Video</SelectItem>
                  <SelectItem value={InterviewType.onSite}>On-Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Interviewer *</Label>
            <Input
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              placeholder="Interviewer name"
              required
            />
          </div>

          {editInterview && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InterviewStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InterviewStatus.scheduled}>Scheduled</SelectItem>
                  <SelectItem value={InterviewStatus.completed}>Completed</SelectItem>
                  <SelectItem value={InterviewStatus.cancelled}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interview notes or instructions..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-teal hover:bg-teal-dark text-white">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editInterview ? 'Update' : 'Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
