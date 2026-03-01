import React, { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCreateTemplate, useUpdateTemplate, CommunicationTemplate } from '../hooks/useQueries';
import { toast } from 'sonner';

const CATEGORIES = ['Application Acknowledgement', 'Interview Invite', 'Rejection', 'Offer', 'Follow-up', 'General'];

const PLACEHOLDERS = [
  '{{candidateName}}',
  '{{jobTitle}}',
  '{{interviewDate}}',
  '{{companyName}}',
  '{{recruiterName}}',
  '{{salary}}',
  '{{startDate}}',
  '{{department}}',
];

const SAMPLE_DATA: Record<string, string> = {
  '{{candidateName}}': 'Alex Johnson',
  '{{jobTitle}}': 'Senior Software Engineer',
  '{{interviewDate}}': 'March 15, 2026 at 2:00 PM',
  '{{companyName}}': 'TechCorp Inc.',
  '{{recruiterName}}': 'Sarah Smith',
  '{{salary}}': '$120,000',
  '{{startDate}}': 'April 1, 2026',
  '{{department}}': 'Engineering',
};

interface TemplateFormProps {
  open: boolean;
  onClose: () => void;
  editTemplate?: CommunicationTemplate | null;
}

export default function TemplateForm({ open, onClose, editTemplate }: TemplateFormProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name);
      setSubject(editTemplate.subject);
      setBody(editTemplate.body);
      setCategory(editTemplate.category);
    } else {
      setName('');
      setSubject('');
      setBody('');
      setCategory(CATEGORIES[0]);
    }
  }, [editTemplate, open]);

  const insertPlaceholder = (placeholder: string) => {
    if (bodyRef) {
      const start = bodyRef.selectionStart;
      const end = bodyRef.selectionEnd;
      const newBody = body.slice(0, start) + placeholder + body.slice(end);
      setBody(newBody);
      setTimeout(() => {
        bodyRef.focus();
        bodyRef.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      setBody((prev) => prev + placeholder);
    }
  };

  const getPreview = () => {
    let preview = body;
    Object.entries(SAMPLE_DATA).forEach(([key, val]) => {
      preview = preview.replaceAll(key, `<strong class="text-teal">${val}</strong>`);
    });
    return preview;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !body) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editTemplate) {
        await updateTemplate.mutateAsync({ id: editTemplate.id, name, subject, body, category });
        toast.success('Template updated');
      } else {
        await createTemplate.mutateAsync({ name, subject, body, category });
        toast.success('Template created');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg.includes('Unauthorized') ? 'Admin access required' : msg);
    }
  };

  const isLoading = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editTemplate ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Create reusable communication templates with dynamic placeholders.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Template Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Interview Invite" required />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Subject *</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" required />
          </div>

          <div className="space-y-1.5">
            <Label>Placeholders</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insertPlaceholder(p)}
                  className="text-xs px-2 py-1 rounded border border-teal/30 text-teal bg-teal/5 hover:bg-teal/15 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="edit">
            <TabsList className="mb-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Textarea
                ref={(el) => setBodyRef(el)}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your template body here. Use placeholders like {{candidateName}} for dynamic content."
                rows={8}
                required
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[200px] p-4 rounded-lg border border-border bg-muted/30 text-sm whitespace-pre-wrap leading-relaxed">
                {body ? (
                  <div dangerouslySetInnerHTML={{ __html: getPreview().replace(/\n/g, '<br/>') }} />
                ) : (
                  <p className="text-muted-foreground italic">No content to preview</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Preview uses sample data for placeholders</p>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-teal hover:bg-teal-dark text-white">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editTemplate ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
