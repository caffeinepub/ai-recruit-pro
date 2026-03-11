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
    totalCandidatesPerJob: Array<[bigint, bigint]>;
    candidatesPerStage: Array<[string, bigint]>;
    averageTimeToHireDays: number;
}
export interface Interview {
    id: bigint;
    status: InterviewStatus;
    interviewer: string;
    jobId: bigint;
    interviewType: InterviewType;
    notes: string;
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
    /**
     * / Apply a candidate to a job. Any authenticated user.
     */
    applyToJob(candidateId: bigint, jobId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Calculate and store a match score for a candidate against a job. Any authenticated user.
     */
    calculateMatchScore(candidateId: bigint, jobId: bigint): Promise<bigint>;
    /**
     * / Create a candidate profile. Any authenticated user (recruiter submitting on behalf).
     */
    createCandidate(name: string, email: string, phone: string, resume: string, skills: Array<string>, experienceYears: bigint): Promise<bigint>;
    /**
     * / Create an interview record. Any authenticated user.
     */
    createInterview(candidateId: bigint, jobId: bigint, dateTime: Time, interviewer: string, interviewType: InterviewType, notes: string): Promise<bigint>;
    /**
     * / Create a new job requisition. Admin only.
     */
    createJob(title: string, department: string, location: string, jobType: JobType, description: string, requiredSkills: Array<string>, experienceLevel: bigint): Promise<bigint>;
    /**
     * / Generate and store an offer letter. Any authenticated user (recruiter).
     */
    createOfferLetter(candidateId: bigint, jobId: bigint, salary: number, startDate: Time, clauses: string): Promise<bigint>;
    /**
     * / Create a communication template. Admin only.
     */
    createTemplate(name: string, subject: string, body: string, category: string): Promise<bigint>;
    /**
     * / Delete a candidate. Admin only.
     */
    deleteCandidate(id: bigint): Promise<void>;
    /**
     * / Delete an interview. Admin only.
     */
    deleteInterview(id: bigint): Promise<void>;
    /**
     * / Delete a job requisition. Admin only.
     */
    deleteJob(id: bigint): Promise<void>;
    /**
     * / Delete an offer letter. Admin only.
     */
    deleteOfferLetter(id: bigint): Promise<void>;
    /**
     * / Delete a communication template. Admin only.
     */
    deleteTemplate(id: bigint): Promise<void>;
    /**
     * / Get recruiter analytics. Any authenticated user.
     */
    getAnalytics(): Promise<AnalyticsResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get a single candidate. Any authenticated user.
     */
    getCandidate(id: bigint): Promise<Candidate | null>;
    /**
     * / Get candidates by job ID. Any authenticated user.
     */
    getCandidatesByJob(jobId: bigint): Promise<Array<Candidate>>;
    /**
     * / Get candidates by pipeline stage for a given job. Any authenticated user.
     */
    getCandidatesByStage(jobId: bigint, stage: CandidateStatus): Promise<Array<Candidate>>;
    /**
     * / Get a single interview. Any authenticated user.
     */
    getInterview(id: bigint): Promise<Interview | null>;
    /**
     * / List interviews for a candidate. Any authenticated user.
     */
    getInterviewsByCandidate(candidateId: bigint): Promise<Array<Interview>>;
    /**
     * / Get a single job requisition. Any authenticated user.
     */
    getJob(id: bigint): Promise<JobRequisition | null>;
    /**
     * / Get an offer letter. Any authenticated user.
     */
    getOfferLetter(id: bigint): Promise<OfferLetter | null>;
    /**
     * / List offer letters for a candidate. Any authenticated user.
     */
    getOffersByCandidate(candidateId: bigint): Promise<Array<OfferLetter>>;
    /**
     * / Get a single template. Any authenticated user.
     */
    getTemplate(id: bigint): Promise<CommunicationTemplate | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List all candidates. Any authenticated user.
     */
    listCandidates(): Promise<Array<Candidate>>;
    /**
     * / List all job requisitions. Any authenticated user.
     */
    listJobs(): Promise<Array<JobRequisition>>;
    /**
     * / List all templates. Any authenticated user.
     */
    listTemplates(): Promise<Array<CommunicationTemplate>>;
    /**
     * / Move a candidate to the next pipeline stage. Recruiter (user) or Admin only.
     */
    moveCandidateStage(candidateId: bigint, newStatus: CandidateStatus, note: string): Promise<void>;
    /**
     * / Parse a resume text and extract structured data. No auth required (public utility).
     */
    parseResume(resumeText: string): Promise<ParsedResume>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Update candidate details. Any authenticated user.
     */
    updateCandidate(id: bigint, name: string, email: string, phone: string, resume: string, skills: Array<string>, experienceYears: bigint): Promise<void>;
    /**
     * / Update an interview record. Any authenticated user.
     */
    updateInterview(id: bigint, dateTime: Time, interviewer: string, interviewType: InterviewType, status: InterviewStatus, notes: string): Promise<void>;
    /**
     * / Update an existing job requisition. Admin only.
     */
    updateJob(id: bigint, title: string, department: string, location: string, jobType: JobType, description: string, requiredSkills: Array<string>, experienceLevel: bigint): Promise<void>;
    /**
     * / Update job status. Admin only.
     */
    updateJobStatus(id: bigint, status: JobStatus): Promise<void>;
    /**
     * / Update offer letter status. Any authenticated user.
     */
    updateOfferStatus(id: bigint, status: OfferStatus): Promise<void>;
    /**
     * / Update a communication template. Admin only.
     */
    updateTemplate(id: bigint, name: string, subject: string, body: string, category: string): Promise<void>;
}
