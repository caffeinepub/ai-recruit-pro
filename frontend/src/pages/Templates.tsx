import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useListTemplates, useDeleteTemplate, CommunicationTemplate } from '../hooks/useQueries';
import TemplateForm from '../components/TemplateForm';
import { toast } from 'sonner';

const CATEGORY_COLORS: Record<string, string> = {
  'Application Acknowledgement': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Interview Invite': 'bg-teal/10 text-teal border-teal/20',
  'Rejection': 'bg-destructive/10 text-destructive border-destructive/20',
  'Offer': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Follow-up': 'bg-amber/10 text-amber border-amber/20',
  'General': 'bg-muted text-muted-foreground border-border',
};

export default function Templates() {
  const { data: templates, isLoading } = useListTemplates();
  const deleteTemplate = useDeleteTemplate();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<CommunicationTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(templates?.map((t) => t.category) || []);
    return Array.from(cats).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    return (templates || []).filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [templates, search, categoryFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success('Template deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      toast.error(msg.includes('Unauthorized') ? 'Admin access required' : msg);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Communication Templates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {templates?.length || 0} templates
          </p>
        </div>
        <Button
          onClick={() => { setEditTemplate(null); setFormOpen(true); }}
          className="bg-teal hover:bg-teal-dark text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Template</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No templates found</p>
          <p className="text-sm mt-1">
            {search || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first template'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <Card key={template.id.toString()} className="border-border bg-card card-hover group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{template.subject}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => { setEditTemplate(template); setFormOpen(true); }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <Badge
                  className={`text-xs border mb-3 ${CATEGORY_COLORS[template.category] || 'bg-muted text-muted-foreground border-border'}`}
                >
                  {template.category}
                </Badge>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {template.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTemplate(null); }}
        editTemplate={editTemplate}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
