import React, { useState, useEffect } from 'react';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useCreateOfferLetter,
  useUpdateOfferStatus,
  useGetOfferLetter,
  Candidate,
  JobRequisition,
  OfferLetter,
  OfferStatus,
} from '../hooks/useQueries';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OfferFormProps {
  open: boolean;
  onClose: () => void;
  candidates: Candidate[];
  jobs: JobRequisition[];
  viewOffer?: OfferLetter | null;
}

const STATUS_COLORS: Record<string, string> = {
  [OfferStatus.pending]: 'bg-amber/10 text-amber border-amber/20',
  [OfferStatus.accepted]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [OfferStatus.declined]: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function OfferForm({
  open,
  onClose,
  candidates,
  jobs,
  viewOffer,
}: OfferFormProps) {
  const createOffer = useCreateOfferLetter();
  const updateStatus = useUpdateOfferStatus();
  const { data: freshOffer, refetch: refetchOffer } = useGetOfferLetter(
    viewOffer?.id ?? null
  );

  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [clauses, setClauses] = useState('');
  const [createdOfferId, setCreatedOfferId] = useState<bigint | null>(null);

  // The offer to display (either freshly fetched or the viewOffer prop)
  const displayOffer = freshOffer ?? viewOffer ?? null;

  useEffect(() => {
    if (!open) {
      setCandidateId('');
      setJobId('');
      setSalary('');
      setStartDate('');
      setClauses('');
      setCreatedOfferId(null);
    }
  }, [open]);

  // Refetch when we just created an offer
  useEffect(() => {
    if (createdOfferId !== null) {
      refetchOffer();
    }
  }, [createdOfferId, refetchOffer]);

  const getCandidateName = (id: bigint) =>
    candidates.find((c) => c.id === id)?.name || `Candidate #${id}`;

  const getJobTitle = (id: bigint) =>
    jobs.find((j) => j.id === id)?.title || `Job #${id}`;

  const formatDate = (ts: bigint) =>
    new Date(Number(ts) / 1_000_000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !jobId || !salary || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDateMs = new Date(startDate).getTime();
    const startDateNs = BigInt(startDateMs) * BigInt(1_000_000);

    try {
      const offerId = await createOffer.mutateAsync({
        candidateId: BigInt(candidateId),
        jobId: BigInt(jobId),
        salary: parseFloat(salary),
        startDate: startDateNs,
        clauses,
      });
      toast.success('Offer letter generated successfully');
      setCreatedOfferId(offerId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg.includes('Unauthorized') ? 'Access denied' : msg);
    }
  };

  const handleStatusUpdate = async (status: OfferStatus) => {
    const targetOffer = displayOffer;
    if (!targetOffer) return;
    try {
      await updateStatus.mutateAsync({ id: targetOffer.id, status });
      toast.success(
        status === OfferStatus.accepted ? 'Offer accepted!' : 'Offer declined'
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const isLoading = createOffer.isPending;
  const isViewMode = !!viewOffer || createdOfferId !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal" />
            {isViewMode ? 'Offer Letter' : 'Generate Offer Letter'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isViewMode
              ? 'Review the offer letter and update its status.'
              : 'Fill in the details to generate a professional offer letter.'}
          </DialogDescription>
        </DialogHeader>

        {isViewMode && displayOffer ? (
          /* ── View Mode ── */
          <div className="space-y-4">
            {/* Offer Summary */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div>
                <p className="font-semibold text-foreground">
                  {getCandidateName(displayOffer.candidateId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getJobTitle(displayOffer.jobId)}
                </p>
              </div>
              <Badge
                className={cn(
                  'text-xs border',
                  STATUS_COLORS[displayOffer.status]
                )}
              >
                {displayOffer.status}
              </Badge>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Annual Salary</p>
                <p className="font-semibold text-foreground">
                  ${displayOffer.salary.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                <p className="font-semibold text-foreground">
                  {formatDate(displayOffer.startDate)}
                </p>
              </div>
            </div>

            {/* Letter Text */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Offer Letter
              </Label>
              <div className="p-4 rounded-lg border border-border bg-muted/20 font-mono text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto text-foreground/80">
                {displayOffer.letterText || 'Loading offer letter content...'}
              </div>
            </div>

            {/* Action Buttons */}
            {displayOffer.status === OfferStatus.pending && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate(OfferStatus.declined)}
                  disabled={updateStatus.isPending}
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Decline Offer
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(OfferStatus.accepted)}
                  disabled={updateStatus.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Accept Offer
                </Button>
              </div>
            )}

            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          /* ── Create Mode ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Job Position *</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="offer-salary">Annual Salary ($) *</Label>
                <Input
                  id="offer-salary"
                  type="number"
                  min="0"
                  step="1000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 120000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offer-start">Start Date *</Label>
                <Input
                  id="offer-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-clauses">Additional Clauses</Label>
              <Textarea
                id="offer-clauses"
                value={clauses}
                onChange={(e) => setClauses(e.target.value)}
                placeholder="Any additional terms, conditions, or benefits to include in the offer letter..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-teal hover:bg-teal-dark text-white gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Generate Offer
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
