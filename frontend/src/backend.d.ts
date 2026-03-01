import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Candidate {
    id: bigint;
    status: CandidateStatus;
    resume: string;
    pipelineLog: Array<PipelineTransition>;
    name: string;
    createdAt: Time;
    email: string;
    updatedAt: Time;
    experienceYears: bigint;
    phone: string;
    appliedJobIds: Array<bigint>;
    matchScores: Array<[bigint, bigint]>;
    skills: Array<string>;
}
export type Time = bigint;
export interface PipelineTransition {
    toStatus: CandidateStatus;
    note: string;
    fromStatus: CandidateStatus;
    timestamp: Time;
}
export interface AnalyticsResult {
    topScoringCandidates: Array<[bigint, bigint]>;
    totalOpenJobs: bigint;
    avgTimeToHirePerJob: Array<[bigint, number]>;
    totalCandidatesPerJob: Array<[bigint, bigint]>;
    last30DaysApplications: Array<bigint>;
    candidatesPerStage: Array<[string, bigint]>;
    topJobsByVolume: Array<[bigint, bigint]>;
    averageTimeToHireDays: number;
    pipelineStageDistribution: Array<[string, bigint]>;
}
export interface Interview {
    id: bigint;
    status: InterviewStatus;
    interviewer: string;
    jobId: bigint;
    jobTitle: string;
    interviewType: InterviewType;
    notes: string;
    candidateName: string;
    dateTime: Time;
    candidateId: bigint;
}
export interface CommunicationTemplate {
    id: bigint;
    subject: string;
    body: string;
    name: string;
    category: string;
}
export interface InterviewInput {
    interviewer: string;
    jobId: bigint;
    interviewType: InterviewType;
    notes: string;
    dateTime: Time;
    candidateId: bigint;
}
export interface ParsedResume {
    previousRoles: Array<string>;
    education: Array<string>;
    experienceYears: bigint;
    skills: Array<string>;
}
export interface JobRequisition {
    id: bigint;
    status: JobStatus;
    experienceLevel: bigint;
    title: string;
    jobType: JobType;
    createdAt: Time;
    description: string;
    department: string;
    requiredSkills: Array<string>;
    location: string;
}
export interface OfferLetter {
    id: bigint;
    status: OfferStatus;
    salary: number;
    createdAt: Time;
    jobId: bigint;
    letterText: string;
    clauses: string;
    candidateId: bigint;
    startDate: Time;
}
export interface UserProfile {
    name: string;
    role: string;
    email: string;
}
export enum CandidateStatus {
    new_ = "new",
    hired = "hired",
    offer = "offer",
    screening = "screening",
    interview = "interview",
    rejected = "rejected",
    shortlisted = "shortlisted"
}
export enum InterviewStatus {
    scheduled = "scheduled",
    cancelled = "cancelled",
    completed = "completed"
}
export enum InterviewType {
    video = "video",
    phone = "phone",
    onSite = "onSite"
}
export enum JobStatus {
    closed = "closed",
    open = "open",
    draft = "draft",
    onHold = "onHold"
}
export enum JobType {
    contract = "contract",
    partTime = "partTime",
    fullTime = "fullTime"
}
export enum OfferStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    applyToJob(candidateId: bigint, jobId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateMatchScore(candidateId: bigint, jobId: bigint): Promise<bigint>;
    createCandidate(name: string, email: string, phone: string, resume: string, skills: Array<string>, experienceYears: bigint): Promise<bigint>;
    createInterview(candidateId: bigint, jobId: bigint, dateTime: Time, interviewer: string, interviewType: InterviewType, notes: string): Promise<bigint>;
    createInterview2(interview: InterviewInput): Promise<bigint>;
    createJob(title: string, department: string, location: string, jobType: JobType, description: string, requiredSkills: Array<string>, experienceLevel: bigint): Promise<bigint>;
    createOfferLetter(candidateId: bigint, jobId: bigint, salary: number, startDate: Time, clauses: string): Promise<bigint>;
    createTemplate(name: string, subject: string, body: string, category: string): Promise<bigint>;
    deleteCandidate(id: bigint): Promise<void>;
    deleteInterview(id: bigint): Promise<void>;
    deleteJob(id: bigint): Promise<void>;
    deleteOfferLetter(id: bigint): Promise<void>;
    deleteTemplate(id: bigint): Promise<void>;
    getAnalytics(): Promise<AnalyticsResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCandidate(id: bigint): Promise<Candidate | null>;
    getCandidatesByJob(jobId: bigint): Promise<Array<Candidate>>;
    getCandidatesByStage(jobId: bigint, stage: CandidateStatus): Promise<Array<Candidate>>;
    getInterview(id: bigint): Promise<Interview | null>;
    getInterviewsByCandidate(candidateId: bigint): Promise<Array<Interview>>;
    getJob(id: bigint): Promise<JobRequisition | null>;
    getOfferLetter(id: bigint): Promise<OfferLetter | null>;
    getOffersByCandidate(candidateId: bigint): Promise<Array<OfferLetter>>;
    getTemplate(id: bigint): Promise<CommunicationTemplate | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listCandidates(): Promise<Array<Candidate>>;
    listInterviews(): Promise<Array<Interview>>;
    listJobs(): Promise<Array<JobRequisition>>;
    listOfferLetters(): Promise<Array<OfferLetter>>;
    listTemplates(): Promise<Array<CommunicationTemplate>>;
    moveCandidateStage(candidateId: bigint, newStatus: CandidateStatus, note: string): Promise<void>;
    parseResume(resumeText: string): Promise<ParsedResume>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCandidate(id: bigint, name: string, email: string, phone: string, resume: string, skills: Array<string>, experienceYears: bigint): Promise<void>;
    updateInterview(id: bigint, dateTime: Time, interviewer: string, interviewType: InterviewType, status: InterviewStatus, notes: string): Promise<void>;
    updateInterview2(id: bigint, dateTime: Time, interviewer: string, interviewType: InterviewType, status: InterviewStatus, notes: string): Promise<void>;
    updateJob(id: bigint, title: string, department: string, location: string, jobType: JobType, description: string, requiredSkills: Array<string>, experienceLevel: bigint): Promise<void>;
    updateJobStatus(id: bigint, status: JobStatus): Promise<void>;
    updateOfferStatus(id: bigint, status: OfferStatus): Promise<void>;
    updateTemplate(id: bigint, name: string, subject: string, body: string, category: string): Promise<void>;
}
