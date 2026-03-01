import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Gift, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  useGetOffersByCandidate,
  useDeleteOfferLetter,
  Candidate,
  OfferLetter,
  OfferStatus,
} from '../hooks/useQueries';
import OfferForm from '../components/OfferForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  [OfferStatus.pending]: 'bg-amber/10 text-amber border-amber/20',
  [OfferStatus.accepted]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [OfferStatus.declined]: 'bg-destructive/10 text-destructive border-destructive/20',
};

function CandidateOffersLoader({
  candidate,
  onLoaded,
}: {
  candidate: Candidate;
  onLoaded: (offers: OfferLetter[], candidate: Candidate) => void;
}) {
  const { data } = useGetOffersByCandidate(candidate.id);
  const calledRef = React.useRef(false);

  useEffect(() => {
    if (data && !calledRef.current) {
      calledRef.current = true;
      onLoaded(data, candidate);
    }
  }, [data, candidate, onLoaded]);

  return null;
}

export default function Offers() {
  const { data: candidates } = useListCandidates();
  const { data: jobs } = useListJobs();
  const deleteOffer = useDeleteOfferLetter();

  const [allOffers, setAllOffers] = useState<{ offer: OfferLetter; candidate: Candidate }[]>([]);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [viewOffer, setViewOffer] = useState<OfferLetter | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const handleOffersLoaded = useCallback(
    (offers: OfferLetter[], candidate: Candidate) => {
      const idStr = candidate.id.toString();
      setLoadedIds((prev) => {
        if (prev.has(idStr)) return prev;
        const next = new Set([...prev, idStr]);
        setAllOffers((prevOffers) => {
          const existingIds = new Set(prevOffers.map((o) => o.offer.id.toString()));
          const newOnes = offers
            .filter((o) => !existingIds.has(o.id.toString()))
            .map((o) => ({ offer: o, candidate }));
          return [...prevOffers, ...newOnes];
        });
        return next;
      });
    },
    []
  );

  const getCandidateName = (id: bigint) =>
    candidates?.find((c) => c.id === id)?.name || `Candidate #${id}`;

  const getJobTitle = (id: bigint) =>
    jobs?.find((j) => j.id === id)?.title || `Job #${id}`;

  const formatDate = (ts: bigint) =>
    new Date(Number(ts) / 1_000_000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOffer.mutateAsync(deleteId);
      setAllOffers((prev) => prev.filter((o) => o.offer.id !== deleteId));
      toast.success('Offer deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg.includes('Unauthorized') ? 'Admin access required' : msg);
    } finally {
      setDeleteId(null);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setViewOffer(null);
    // Refresh offers by resetting loaded state
    setLoadedIds(new Set());
    setAllOffers([]);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Load offers for each candidate */}
      {(candidates || []).map((c) => (
        <CandidateOffersLoader key={c.id.toString()} candidate={c} onLoaded={handleOffersLoaded} />
      ))}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Offer Letters</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allOffers.length} offer{allOffers.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <Button
          onClick={() => {
            setViewOffer(null);
            setFormOpen(true);
          }}
          className="bg-teal hover:bg-teal-dark text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Generate Offer</span>
        </Button>
      </div>

      {/* Content */}
      {!candidates ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : allOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Gift className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No offer letters yet</p>
          <p className="text-sm mt-1">Generate your first offer letter to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allOffers.map(({ offer }) => (
            <Card key={offer.id.toString()} className="border-border bg-card card-hover group">
              <CardContent className="p-4">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal/20 to-amber/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-teal" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {getCandidateName(offer.candidateId)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getJobTitle(offer.jobId)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'text-xs border flex-shrink-0 ml-2',
                      STATUS_COLORS[offer.status]
                    )}
                  >
                    {offer.status}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  <div className="flex justify-between">
                    <span>Annual Salary</span>
                    <span className="font-semibold text-foreground">
                      ${offer.salary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start Date</span>
                    <span className="font-medium text-foreground">
                      {formatDate(offer.startDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{formatDate(offer.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1.5 text-teal border-teal/30 hover:bg-teal/10"
                    onClick={() => {
                      setViewOffer(offer);
                      setFormOpen(true);
                    }}
                  >
                    <FileText className="w-3 h-3" />
                    View Letter
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(offer.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Offer Form / View Dialog */}
      <OfferForm
        open={formOpen}
        onClose={handleFormClose}
        candidates={candidates || []}
        jobs={jobs || []}
        viewOffer={viewOffer}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer Letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The offer letter will be permanently deleted.
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
