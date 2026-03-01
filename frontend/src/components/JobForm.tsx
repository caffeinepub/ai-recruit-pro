import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCreateJob, useUpdateJob, JobRequisition, JobType, JobStatus } from '../hooks/useQueries';
import { toast } from 'sonner';

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  editJob?: JobRequisition | null;
}

export default function JobForm({ open, onClose, editJob }: JobFormProps) {
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<JobType>(JobType.fullTime);
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');

  useEffect(() => {
    if (editJob) {
      setTitle(editJob.title);
      setDepartment(editJob.department);
      setLocation(editJob.location);
      setJobType(editJob.jobType as JobType);
      setDescription(editJob.description);
      setRequiredSkills([...editJob.requiredSkills]);
      setExperienceLevel(editJob.experienceLevel.toString());
    } else {
      setTitle('');
      setDepartment('');
      setLocation('');
      setJobType(JobType.fullTime);
      setDescription('');
      setRequiredSkills([]);
      setExperienceLevel('');
    }
  }, [editJob, open]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !requiredSkills.includes(s)) {
      setRequiredSkills((prev) => [...prev, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !department || !location || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editJob) {
        await updateJob.mutateAsync({
          id: editJob.id,
          title,
          department,
          location,
          jobType,
          description,
          requiredSkills,
          experienceLevel: BigInt(experienceLevel || '0'),
        });
        toast.success('Job updated successfully');
      } else {
        await createJob.mutateAsync({
          title,
          department,
          location,
          jobType,
          description,
          requiredSkills,
          experienceLevel: BigInt(experienceLevel || '0'),
        });
        toast.success('Job created successfully');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg.includes('Unauthorized') ? 'Admin access required' : msg);
    }
  };

  const isLoading = createJob.isPending || updateJob.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-border">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-lg">
            {editJob ? 'Edit Job Requisition' : 'Create Job Requisition'}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            {editJob ? 'Update the job details below.' : 'Fill in the details to post a new job.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Job Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department *</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Job Type</Label>
              <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={JobType.fullTime}>Full Time</SelectItem>
                  <SelectItem value={JobType.partTime}>Part Time</SelectItem>
                  <SelectItem value={JobType.contract}>Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp">Experience (years)</Label>
              <Input
                id="exp"
                type="number"
                min="0"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Required Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill and press Enter"
              />
              <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {requiredSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
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
              {editJob ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
