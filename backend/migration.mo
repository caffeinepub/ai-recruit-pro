import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type JobType = {
    #fullTime;
    #partTime;
    #contract;
  };

  type JobStatus = {
    #draft;
    #open;
    #closed;
    #onHold;
  };

  type CandidateStatus = {
    #new;
    #screening;
    #shortlisted;
    #interview;
    #offer;
    #hired;
    #rejected;
  };

  type InterviewType = {
    #phone;
    #video;
    #onSite;
  };

  type InterviewStatus = {
    #scheduled;
    #completed;
    #cancelled;
  };

  type OfferStatus = {
    #pending;
    #accepted;
    #declined;
  };

  type JobRequisition = {
    id : Nat;
    title : Text;
    department : Text;
    location : Text;
    jobType : JobType;
    description : Text;
    requiredSkills : [Text];
    experienceLevel : Nat;
    status : JobStatus;
    createdAt : Time.Time;
  };

  type PipelineTransition = {
    fromStatus : CandidateStatus;
    toStatus : CandidateStatus;
    timestamp : Time.Time;
    note : Text;
  };

  type Candidate = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    resume : Text;
    skills : [Text];
    experienceYears : Nat;
    status : CandidateStatus;
    appliedJobIds : [Nat];
    matchScores : [(Nat, Nat)];
    pipelineLog : [PipelineTransition];
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type OldInterview = {
    id : Nat;
    candidateId : Nat;
    jobId : Nat;
    dateTime : Time.Time;
    interviewer : Text;
    interviewType : InterviewType;
    status : InterviewStatus;
    notes : Text;
  };

  type NewInterview = {
    id : Nat;
    candidateId : Nat;
    candidateName : Text;
    jobId : Nat;
    jobTitle : Text;
    dateTime : Time.Time;
    interviewer : Text;
    interviewType : InterviewType;
    status : InterviewStatus;
    notes : Text;
  };

  type CommunicationTemplate = {
    id : Nat;
    name : Text;
    subject : Text;
    body : Text;
    category : Text;
  };

  type OfferLetter = {
    id : Nat;
    candidateId : Nat;
    jobId : Nat;
    salary : Float;
    startDate : Time.Time;
    clauses : Text;
    status : OfferStatus;
    letterText : Text;
    createdAt : Time.Time;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    role : Text;
  };

  type OldActor = {
    nextJobId : Nat;
    nextCandidateId : Nat;
    nextInterviewId : Nat;
    nextTemplateId : Nat;
    nextOfferId : Nat;
    jobRequisitions : Map.Map<Nat, JobRequisition>;
    candidates : Map.Map<Nat, Candidate>;
    interviews : Map.Map<Nat, OldInterview>;
    communicationTemplates : Map.Map<Nat, CommunicationTemplate>;
    offerLetters : Map.Map<Nat, OfferLetter>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    nextJobId : Nat;
    nextCandidateId : Nat;
    nextInterviewId : Nat;
    nextTemplateId : Nat;
    nextOfferId : Nat;
    jobRequisitions : Map.Map<Nat, JobRequisition>;
    candidates : Map.Map<Nat, Candidate>;
    interviews : Map.Map<Nat, NewInterview>;
    communicationTemplates : Map.Map<Nat, CommunicationTemplate>;
    offerLetters : Map.Map<Nat, OfferLetter>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newInterviews = old.interviews.map<Nat, OldInterview, NewInterview>(
      func(_id, oldInterview) {
        {
          oldInterview with
          candidateName = "";
          jobTitle = "";
        };
      }
    );
    { old with interviews = newInterviews };
  };
};
