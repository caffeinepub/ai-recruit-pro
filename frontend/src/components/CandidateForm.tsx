import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCreateCandidate, useUpdateCandidate, useParseResume, Candidate } from '../hooks/useQueries';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CandidateFormProps {
  open: boolean;
  onClose: () => void;
  editCandidate?: Candidate | null;
}

export default function CandidateForm({ open, onClose, editCandidate }: CandidateFormProps) {
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const parseResume = useParseResume();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resume, setResume] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('');

  useEffect(() => {
    if (editCandidate) {
      setName(editCandidate.name);
      setEmail(editCandidate.email);
      setPhone(editCandidate.phone);
      setResume(editCandidate.resume);
      setSkills([...editCandidate.skills]);
      setExperienceYears(editCandidate.experienceYears.toString());
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setResume('');
      setSkills([]);
      setExperienceYears('');
    }
  }, [editCandidate, open]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleParseResume = async () => {
    if (!resume.trim()) {
      toast.error('Please paste your resume text first');
      return;
    }
    try {
      const parsed = await parseResume.mutateAsync(resume);
      if (parsed.skills.length > 0) {
        setSkills((prev) => {
          const combined = [...new Set([...prev, ...parsed.skills])];
          return combined;
        });
      }
      if (parsed.experienceYears > 0) {
        setExperienceYears(parsed.experienceYears.toString());
      }
      toast.success(`Parsed: ${parsed.skills.length} skills, ${parsed.experienceYears} years exp, ${parsed.education.length} education entries`);
    } catch {
      toast.error('Failed to parse resume');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      if (editCandidate) {
        await updateCandidate.mutateAsync({
          id: editCandidate.id,
          name,
          email,
          phone,
          resume,
          skills,
          experienceYears: BigInt(experienceYears || '0'),
        });
        toast.success('Candidate updated');
      } else {
        await createCandidate.mutateAsync({
          name,
          email,
          phone,
          resume,
          skills,
          experienceYears: BigInt(experienceYears || '0'),
        });
        toast.success('Candidate created');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg.includes('Unauthorized') ? 'Access denied' : msg);
    }
  };

  const isLoading = createCandidate.isPending || updateCandidate.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-border">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-lg">
            {editCandidate ? 'Edit Candidate' : 'Add Candidate'}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            {editCandidate ? 'Update candidate profile.' : 'Add a new candidate to the system.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cname">Full Name *</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cemail">Email *</Label>
              <Input id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Phone</Label>
              <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cexp">Experience (years)</Label>
            <Input
              id="cexp"
              type="number"
              min="0"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cresume">Resume Text</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParseResume}
                disabled={parseResume.isPending || !resume.trim()}
                className={cn(
                  'h-7 text-xs gap-1.5 border-teal/30 text-teal hover:bg-teal/10',
                  parseResume.isPending && 'opacity-70'
                )}
              >
                {parseResume.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI Parse
              </Button>
            </div>
            <div className="relative">
              <FileText className="absolute top-3 left-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                id="cresume"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste resume text here... AI will extract skills and experience automatically"
                rows={5}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add skill and press Enter"
              />
              <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1 bg-teal/10 text-teal border-teal/20">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-teal hover:bg-teal-dark text-white">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editCandidate ? 'Update' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
