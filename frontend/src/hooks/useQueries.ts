import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  JobRequisition,
  Candidate,
  Interview,
  CommunicationTemplate,
  OfferLetter,
  AnalyticsResult,
  ParsedResume,
} from '../backend';
import {
  JobType,
  JobStatus,
  CandidateStatus,
  InterviewType,
  InterviewStatus,
  OfferStatus,
} from '../backend';

export type { UserProfile, JobRequisition, Candidate, Interview, CommunicationTemplate, OfferLetter, AnalyticsResult, ParsedResume };
export { JobType, JobStatus, CandidateStatus, InterviewType, InterviewStatus, OfferStatus };

// ── User Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────

export function useGetAnalytics() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AnalyticsResult>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAnalytics();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30_000,
  });
}

// ── Jobs ──────────────────────────────────────────────────────────────────

export function useListJobs() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<JobRequisition[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listJobs();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetJob(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<JobRequisition | null>({
    queryKey: ['job', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error('Actor not available');
      return actor.getJob(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
  });
}

export function useCreateJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      department: string;
      location: string;
      jobType: JobType;
      description: string;
      requiredSkills: string[];
      experienceLevel: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createJob(
        params.title,
        params.department,
        params.location,
        params.jobType,
        params.description,
        params.requiredSkills,
        params.experienceLevel
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      title: string;
      department: string;
      location: string;
      jobType: JobType;
      description: string;
      requiredSkills: string[];
      experienceLevel: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateJob(
        params.id,
        params.title,
        params.department,
        params.location,
        params.jobType,
        params.description,
        params.requiredSkills,
        params.experienceLevel
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', vars.id.toString()] });
    },
  });
}

export function useUpdateJobStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; status: JobStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateJobStatus(params.id, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteJob(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// ── Candidates ────────────────────────────────────────────────────────────

export function useListCandidates() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listCandidates();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCandidate(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Candidate | null>({
    queryKey: ['candidate', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error('Actor not available');
      return actor.getCandidate(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
  });
}

export function useGetCandidatesByJob(jobId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Candidate[]>({
    queryKey: ['candidatesByJob', jobId?.toString()],
    queryFn: async () => {
      if (!actor || jobId === null) throw new Error('Actor not available');
      return actor.getCandidatesByJob(jobId);
    },
    enabled: !!actor && !actorFetching && jobId !== null,
  });
}

export function useCreateCandidate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      email: string;
      phone: string;
      resume: string;
      skills: string[];
      experienceYears: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCandidate(
        params.name,
        params.email,
        params.phone,
        params.resume,
        params.skills,
        params.experienceYears
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateCandidate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      email: string;
      phone: string;
      resume: string;
      skills: string[];
      experienceYears: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCandidate(
        params.id,
        params.name,
        params.email,
        params.phone,
        params.resume,
        params.skills,
        params.experienceYears
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', vars.id.toString()] });
    },
  });
}

export function useDeleteCandidate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCandidate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useParseResume() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (resumeText: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.parseResume(resumeText);
    },
  });
}

export function useCalculateMatchScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { candidateId: bigint; jobId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.calculateMatchScore(params.candidateId, params.jobId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', vars.candidateId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useApplyToJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { candidateId: bigint; jobId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.applyToJob(params.candidateId, params.jobId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', vars.candidateId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['candidatesByJob', vars.jobId.toString()] });
    },
  });
}

export function useMoveCandidateStage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      candidateId: bigint;
      newStatus: CandidateStatus;
      note: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveCandidateStage(params.candidateId, params.newStatus, params.note);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', vars.candidateId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// ── Interviews ────────────────────────────────────────────────────────────

export function useGetInterviewsByCandidate(candidateId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Interview[]>({
    queryKey: ['interviewsByCandidate', candidateId?.toString()],
    queryFn: async () => {
      if (!actor || candidateId === null) throw new Error('Actor not available');
      return actor.getInterviewsByCandidate(candidateId);
    },
    enabled: !!actor && !actorFetching && candidateId !== null,
  });
}

export function useGetInterview(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Interview | null>({
    queryKey: ['interview', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error('Actor not available');
      return actor.getInterview(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
  });
}

export function useCreateInterview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      candidateId: bigint;
      jobId: bigint;
      dateTime: bigint;
      interviewer: string;
      interviewType: InterviewType;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createInterview(
        params.candidateId,
        params.jobId,
        params.dateTime,
        params.interviewer,
        params.interviewType,
        params.notes
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['interviewsByCandidate', vars.candidateId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allInterviews'] });
    },
  });
}

export function useUpdateInterview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      dateTime: bigint;
      interviewer: string;
      interviewType: InterviewType;
      status: InterviewStatus;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInterview(
        params.id,
        params.dateTime,
        params.interviewer,
        params.interviewType,
        params.status,
        params.notes
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['interview', vars.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allInterviews'] });
    },
  });
}

export function useDeleteInterview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteInterview(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allInterviews'] });
    },
  });
}

// ── Templates ─────────────────────────────────────────────────────────────

export function useListTemplates() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CommunicationTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listTemplates();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTemplate(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CommunicationTemplate | null>({
    queryKey: ['template', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error('Actor not available');
      return actor.getTemplate(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
  });
}

export function useCreateTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      subject: string;
      body: string;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTemplate(params.name, params.subject, params.body, params.category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      subject: string;
      body: string;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTemplate(params.id, params.name, params.subject, params.body, params.category);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', vars.id.toString()] });
    },
  });
}

export function useDeleteTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// ── Offers ────────────────────────────────────────────────────────────────

export function useGetOffersByCandidate(candidateId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OfferLetter[]>({
    queryKey: ['offersByCandidate', candidateId?.toString()],
    queryFn: async () => {
      if (!actor || candidateId === null) throw new Error('Actor not available');
      return actor.getOffersByCandidate(candidateId);
    },
    enabled: !!actor && !actorFetching && candidateId !== null,
  });
}

export function useGetOfferLetter(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OfferLetter | null>({
    queryKey: ['offerLetter', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error('Actor not available');
      return actor.getOfferLetter(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
  });
}

export function useCreateOfferLetter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      candidateId: bigint;
      jobId: bigint;
      salary: number;
      startDate: bigint;
      clauses: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOfferLetter(
        params.candidateId,
        params.jobId,
        params.salary,
        params.startDate,
        params.clauses
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['offersByCandidate', vars.candidateId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allOffers'] });
    },
  });
}

export function useUpdateOfferStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; status: OfferStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOfferStatus(params.id, params.status);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['offerLetter', vars.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allOffers'] });
    },
  });
}

export function useDeleteOfferLetter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteOfferLetter(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allOffers'] });
    },
  });
}
