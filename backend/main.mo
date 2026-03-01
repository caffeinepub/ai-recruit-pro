import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Prefab authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── User Profile ──────────────────────────────────────────────────────────
  public type UserProfile = {
    name : Text;
    email : Text;
    role : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Domain Types ──────────────────────────────────────────────────────────

  public type JobType = {
    #fullTime;
    #partTime;
    #contract;
  };

  public type JobStatus = {
    #draft;
    #open;
    #closed;
    #onHold;
  };

  public type CandidateStatus = {
    #new;
    #screening;
    #shortlisted;
    #interview;
    #offer;
    #hired;
    #rejected;
  };

  public type InterviewType = {
    #phone;
    #video;
    #onSite;
  };

  public type InterviewStatus = {
    #scheduled;
    #completed;
    #cancelled;
  };

  public type OfferStatus = {
    #pending;
    #accepted;
    #declined;
  };

  // ── Data Records ──────────────────────────────────────────────────────────

  public type JobRequisition = {
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

  public type PipelineTransition = {
    fromStatus : CandidateStatus;
    toStatus : CandidateStatus;
    timestamp : Time.Time;
    note : Text;
  };

  public type Candidate = {
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

  public type Interview = {
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

  public type CommunicationTemplate = {
    id : Nat;
    name : Text;
    subject : Text;
    body : Text;
    category : Text;
  };

  public type OfferLetter = {
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

  public type ParsedResume = {
    skills : [Text];
    experienceYears : Nat;
    education : [Text];
    previousRoles : [Text];
  };

  public type AnalyticsResult = {
    totalOpenJobs : Nat;
    totalCandidatesPerJob : [(Nat, Nat)];
    candidatesPerStage : [(Text, Nat)];
    averageTimeToHireDays : Float;
    topScoringCandidates : [(Nat, Nat)];
    last30DaysApplications : [Nat];
    pipelineStageDistribution : [(Text, Nat)];
    topJobsByVolume : [(Nat, Nat)];
    avgTimeToHirePerJob : [(Nat, Float)];
  };

  public type InterviewInput = {
    candidateId : Nat;
    jobId : Nat;
    dateTime : Time.Time;
    interviewer : Text;
    interviewType : InterviewType;
    notes : Text;
  };

  var nextJobId : Nat = 0;
  var nextCandidateId : Nat = 0;
  var nextInterviewId : Nat = 0;
  var nextTemplateId : Nat = 0;
  var nextOfferId : Nat = 0;

  let jobRequisitions = Map.empty<Nat, JobRequisition>();
  let candidates = Map.empty<Nat, Candidate>();
  let interviews = Map.empty<Nat, Interview>();
  let communicationTemplates = Map.empty<Nat, CommunicationTemplate>();
  let offerLetters = Map.empty<Nat, OfferLetter>();

  func containsSkill(skills : [Text], target : Text) : Bool {
    let targetLower = target.toLower();
    for (s in skills.values()) {
      if (s.toLower() == targetLower) return true;
    };
    false;
  };

  public shared ({ caller }) func createJob(
    title : Text,
    department : Text,
    location : Text,
    jobType : JobType,
    description : Text,
    requiredSkills : [Text],
    experienceLevel : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create jobs");
    };
    let id = nextJobId;
    nextJobId += 1;
    let job : JobRequisition = {
      id;
      title;
      department;
      location;
      jobType;
      description;
      requiredSkills;
      experienceLevel;
      status = #draft;
      createdAt = Time.now();
    };
    jobRequisitions.add(id, job);
    id;
  };

  public shared ({ caller }) func updateJob(
    id : Nat,
    title : Text,
    department : Text,
    location : Text,
    jobType : JobType,
    description : Text,
    requiredSkills : [Text],
    experienceLevel : Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update jobs");
    };
    switch (jobRequisitions.get(id)) {
      case (null) Runtime.trap("Job not found");
      case (?existing) {
        let updated : JobRequisition = {
          id;
          title;
          department;
          location;
          jobType;
          description;
          requiredSkills;
          experienceLevel;
          status = existing.status;
          createdAt = existing.createdAt;
        };
        jobRequisitions.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func updateJobStatus(id : Nat, status : JobStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update job status");
    };
    switch (jobRequisitions.get(id)) {
      case (null) Runtime.trap("Job not found");
      case (?existing) {
        let updated : JobRequisition = {
          id = existing.id;
          title = existing.title;
          department = existing.department;
          location = existing.location;
          jobType = existing.jobType;
          description = existing.description;
          requiredSkills = existing.requiredSkills;
          experienceLevel = existing.experienceLevel;
          status;
          createdAt = existing.createdAt;
        };
        jobRequisitions.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteJob(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete jobs");
    };
    if (not jobRequisitions.containsKey(id)) {
      Runtime.trap("Job not found");
    };
    jobRequisitions.remove(id);
  };

  public query ({ caller }) func getJob(id : Nat) : async ?JobRequisition {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view jobs");
    };
    jobRequisitions.get(id);
  };

  public query ({ caller }) func listJobs() : async [JobRequisition] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list jobs");
    };
    let result = List.empty<JobRequisition>();
    for ((_, job) in jobRequisitions.entries()) {
      result.add(job);
    };
    result.toArray();
  };

  public shared ({ caller }) func createCandidate(
    name : Text,
    email : Text,
    phone : Text,
    resume : Text,
    skills : [Text],
    experienceYears : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create candidates");
    };
    let id = nextCandidateId;
    nextCandidateId += 1;
    let candidate : Candidate = {
      id;
      name;
      email;
      phone;
      resume;
      skills;
      experienceYears;
      status = #new;
      appliedJobIds = [];
      matchScores = [];
      pipelineLog = [];
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    candidates.add(id, candidate);
    id;
  };

  public shared ({ caller }) func updateCandidate(
    id : Nat,
    name : Text,
    email : Text,
    phone : Text,
    resume : Text,
    skills : [Text],
    experienceYears : Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update candidates");
    };
    switch (candidates.get(id)) {
      case (null) Runtime.trap("Candidate not found");
      case (?existing) {
        let updated : Candidate = {
          id;
          name;
          email;
          phone;
          resume;
          skills;
          experienceYears;
          status = existing.status;
          appliedJobIds = existing.appliedJobIds;
          matchScores = existing.matchScores;
          pipelineLog = existing.pipelineLog;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        candidates.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteCandidate(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete candidates");
    };
    if (not candidates.containsKey(id)) {
      Runtime.trap("Candidate not found");
    };
    candidates.remove(id);
  };

  public query ({ caller }) func getCandidate(id : Nat) : async ?Candidate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view candidates");
    };
    candidates.get(id);
  };

  public query ({ caller }) func listCandidates() : async [Candidate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list candidates");
    };
    let result = List.empty<Candidate>();
    for ((_, c) in candidates.entries()) {
      result.add(c);
    };
    result.toArray();
  };

  public query ({ caller }) func getCandidatesByJob(jobId : Nat) : async [Candidate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query candidates by job");
    };
    let result = List.empty<Candidate>();
    for ((_, c) in candidates.entries()) {
      for (jid in c.appliedJobIds.values()) {
        if (jid == jobId) {
          result.add(c);
        };
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func applyToJob(candidateId : Nat, jobId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply candidates to jobs");
    };
    switch (candidates.get(candidateId)) {
      case (null) Runtime.trap("Candidate not found");
      case (?existing) {
        for (jid in existing.appliedJobIds.values()) {
          if (jid == jobId) Runtime.trap("Already applied to this job");
        };
        let newApplied = List.fromArray<Nat>(existing.appliedJobIds);
        newApplied.add(jobId);
        let updated : Candidate = {
          id = existing.id;
          name = existing.name;
          email = existing.email;
          phone = existing.phone;
          resume = existing.resume;
          skills = existing.skills;
          experienceYears = existing.experienceYears;
          status = existing.status;
          appliedJobIds = newApplied.toArray();
          matchScores = existing.matchScores;
          pipelineLog = existing.pipelineLog;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        candidates.add(candidateId, updated);
      };
    };
  };

  // parseResume requires #user authorization to prevent anonymous abuse
  public query ({ caller }) func parseResume(resumeText : Text) : async ParsedResume {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can parse resumes");
    };
    let knownSkills = [
      "Motoko", "Rust", "Python", "JavaScript", "TypeScript", "Java", "Go",
      "Blockchain", "Smart Contracts", "Software Development", "React", "Node.js",
      "SQL", "NoSQL", "AWS", "Docker", "Kubernetes", "Machine Learning", "AI",
      "Solidity", "ICP", "Internet Computer",
    ];
    let knownRoles = [
      "Software Engineer", "Developer", "Architect", "Manager", "Lead",
      "Analyst", "Designer", "Consultant", "Director", "VP", "CTO", "CEO",
    ];
    let knownEducation = [
      "Bachelor", "Master", "PhD", "BSc", "MSc", "MBA", "Associate",
      "Computer Science", "Engineering", "Mathematics", "Physics",
    ];

    let resumeLower = resumeText.toLower();
    let matchedSkills = List.empty<Text>();
    let matchedRoles = List.empty<Text>();
    let matchedEducation = List.empty<Text>();
    var experienceYears : Nat = 0;

    for (skill in knownSkills.values()) {
      if (resumeLower.contains(#text (skill.toLower()))) {
        matchedSkills.add(skill);
      };
    };

    for (role in knownRoles.values()) {
      if (resumeLower.contains(#text (role.toLower()))) {
        matchedRoles.add(role);
      };
    };

    for (edu in knownEducation.values()) {
      if (resumeLower.contains(#text (edu.toLower()))) {
        matchedEducation.add(edu);
      };
    };

    if (resumeLower.contains(#text "10+ years") or resumeLower.contains(#text "10 years")) {
      experienceYears := 10;
    } else if (resumeLower.contains(#text "8 years") or resumeLower.contains(#text "9 years")) {
      experienceYears := 8;
    } else if (resumeLower.contains(#text "5 years") or resumeLower.contains(#text "6 years") or resumeLower.contains(#text "7 years")) {
      experienceYears := 5;
    } else if (resumeLower.contains(#text "3 years") or resumeLower.contains(#text "4 years")) {
      experienceYears := 3;
    } else if (resumeLower.contains(#text "1 year") or resumeLower.contains(#text "2 years")) {
      experienceYears := 1;
    } else if (resumeLower.contains(#text "years of experience")) {
      experienceYears := 2;
    };

    {
      skills = matchedSkills.toArray();
      experienceYears;
      education = matchedEducation.toArray();
      previousRoles = matchedRoles.toArray();
    };
  };

  public shared ({ caller }) func calculateMatchScore(candidateId : Nat, jobId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate match scores");
    };
    switch (candidates.get(candidateId)) {
      case (null) Runtime.trap("Candidate not found");
      case (?candidate) {
        switch (jobRequisitions.get(jobId)) {
          case (null) Runtime.trap("Job not found");
          case (?job) {
            let requiredCount = job.requiredSkills.size();
            if (requiredCount == 0) return 0;

            var matched : Nat = 0;
            for (reqSkill in job.requiredSkills.values()) {
              if (containsSkill(candidate.skills, reqSkill)) {
                matched += 1;
              };
            };

            let skillsScore : Int = (matched * 60) / requiredCount;

            let expDiff : Int = Int.fromNat(candidate.experienceYears) - Int.fromNat(job.experienceLevel);
            let expScore : Int = if (expDiff >= 0) { 40 } else {
              let penalty = Int.abs(expDiff) * 5;
              if (penalty > 40) { 0 } else { 40 - penalty };
            };

            let total : Int = skillsScore + expScore;
            let finalScore : Nat = if (total <= 0) { 0 } else if (total >= 100) { 100 } else { Int.abs(total) };

            let newScores = List.empty<(Nat, Nat)>();
            var replaced = false;
            for ((jid, score) in candidate.matchScores.values()) {
              if (jid == jobId) {
                newScores.add((jobId, finalScore));
                replaced := true;
              } else {
                newScores.add((jid, score));
              };
            };
            if (not replaced) { newScores.add((jobId, finalScore)) };

            let updated : Candidate = {
              id = candidate.id;
              name = candidate.name;
              email = candidate.email;
              phone = candidate.phone;
              resume = candidate.resume;
              skills = candidate.skills;
              experienceYears = candidate.experienceYears;
              status = candidate.status;
              appliedJobIds = candidate.appliedJobIds;
              matchScores = newScores.toArray();
              pipelineLog = candidate.pipelineLog;
              createdAt = candidate.createdAt;
              updatedAt = Time.now();
            };
            candidates.add(candidateId, updated);
            finalScore;
          };
        };
      };
    };
  };

  public shared ({ caller }) func moveCandidateStage(
    candidateId : Nat,
    newStatus : CandidateStatus,
    note : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users (recruiters/admins) can move candidates through the pipeline");
    };
    switch (candidates.get(candidateId)) {
      case (null) Runtime.trap("Candidate not found");
      case (?existing) {
        let transition : PipelineTransition = {
          fromStatus = existing.status;
          toStatus = newStatus;
          timestamp = Time.now();
          note;
        };
        let newLog = List.fromArray<PipelineTransition>(existing.pipelineLog);
        newLog.add(transition);
        let updated : Candidate = {
          id = existing.id;
          name = existing.name;
          email = existing.email;
          phone = existing.phone;
          resume = existing.resume;
          skills = existing.skills;
          experienceYears = existing.experienceYears;
          status = newStatus;
          appliedJobIds = existing.appliedJobIds;
          matchScores = existing.matchScores;
          pipelineLog = newLog.toArray();
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        candidates.add(candidateId, updated);
      };
    };
  };

  public query ({ caller }) func getCandidatesByStage(jobId : Nat, stage : CandidateStatus) : async [Candidate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query pipeline stages");
    };
    let result = List.empty<Candidate>();
    for ((_, c) in candidates.entries()) {
      if (c.status == stage) {
        for (jid in c.appliedJobIds.values()) {
          if (jid == jobId) {
            result.add(c);
          };
        };
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func createInterview(
    candidateId : Nat,
    jobId : Nat,
    dateTime : Time.Time,
    interviewer : Text,
    interviewType : InterviewType,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can schedule interviews");
    };
    let candidateName = switch (candidates.get(candidateId)) {
      case (null) Runtime.trap("Candidate not found");
      case (?c) c.name;
    };
    let jobTitle = switch (jobRequisitions.get(jobId)) {
      case (null) Runtime.trap("Job not found");
      case (?j) j.title;
    };
    let id = nextInterviewId;
    nextInterviewId += 1;
    let interview : Interview = {
      id;
      candidateId;
      candidateName;
      jobId;
      jobTitle;
      dateTime;
      interviewer;
      interviewType;
      status = #scheduled;
      notes;
    };
    interviews.add(id, interview);
    id;
  };

  public shared ({ caller }) func updateInterview(
    id : Nat,
    dateTime : Time.Time,
    interviewer : Text,
    interviewType : InterviewType,
    status : InterviewStatus,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update interviews");
    };
    switch (interviews.get(id)) {
      case (null) Runtime.trap("Interview not found");
      case (?existing) {
        let updated : Interview = {
          id;
          candidateId = existing.candidateId;
          candidateName = existing.candidateName;
          jobId = existing.jobId;
          jobTitle = existing.jobTitle;
          dateTime;
          interviewer;
          interviewType;
          status;
          notes;
        };
        interviews.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteInterview(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete interviews");
    };
    if (not interviews.containsKey(id)) {
      Runtime.trap("Interview not found");
    };
    interviews.remove(id);
  };

  public query ({ caller }) func getInterview(id : Nat) : async ?Interview {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view interviews");
    };
    interviews.get(id);
  };

  public query ({ caller }) func listInterviews() : async [Interview] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list interviews");
    };
    let result = List.empty<Interview>();
    for ((_, iv) in interviews.entries()) {
      result.add(iv);
    };
    result.toArray();
  };

  public query ({ caller }) func getInterviewsByCandidate(candidateId : Nat) : async [Interview] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list interviews");
    };
    let result = List.empty<Interview>();
    for ((_, iv) in interviews.entries()) {
      if (iv.candidateId == candidateId) result.add(iv);
    };
    result.toArray();
  };

  public shared ({ caller }) func createTemplate(
    name : Text,
    subject : Text,
    body : Text,
    category : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create templates");
    };
    let id = nextTemplateId;
    nextTemplateId += 1;
    let tmpl : CommunicationTemplate = { id; name; subject; body; category };
    communicationTemplates.add(id, tmpl);
    id;
  };

  public shared ({ caller }) func updateTemplate(
    id : Nat,
    name : Text,
    subject : Text,
    body : Text,
    category : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update templates");
    };
    if (not communicationTemplates.containsKey(id)) {
      Runtime.trap("Template not found");
    };
    communicationTemplates.add(id, { id; name; subject; body; category });
  };

  public shared ({ caller }) func deleteTemplate(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete templates");
    };
    if (not communicationTemplates.containsKey(id)) {
      Runtime.trap("Template not found");
    };
    communicationTemplates.remove(id);
  };

  public query ({ caller }) func getTemplate(id : Nat) : async ?CommunicationTemplate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view templates");
    };
    communicationTemplates.get(id);
  };

  public query ({ caller }) func listTemplates() : async [CommunicationTemplate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list templates");
    };
    let result = List.empty<CommunicationTemplate>();
    for ((_, t) in communicationTemplates.entries()) {
      result.add(t);
    };
    result.toArray();
  };

  func generateOfferText(
    candidateName : Text,
    jobTitle : Text,
    salary : Float,
    startDate : Time.Time,
    clauses : Text,
  ) : Text {
    "OFFER LETTER\n\n"
    # "Dear " # candidateName # ",\n\n"
    # "We are pleased to offer you the position of " # jobTitle # ".\n\n"
    # "Salary: " # salary.toText() # " per annum\n"
    # "Start Date: " # startDate.toText() # "\n\n"
    # "Additional Terms:\n" # clauses # "\n\n"
    # "Please sign and return this letter to confirm your acceptance.\n\n"
    # "Sincerely,\nThe Hiring Team\n";
  };

  public shared ({ caller }) func createOfferLetter(
    candidateId : Nat,
    jobId : Nat,
    salary : Float,
    startDate : Time.Time,
    clauses : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create offer letters");
    };
    let candidateName = switch (candidates.get(candidateId)) {
      case (null) Runtime.trap("Candidate not found");
      case (?c) c.name;
    };
    let jobTitle = switch (jobRequisitions.get(jobId)) {
      case (null) Runtime.trap("Job not found");
      case (?j) j.title;
    };
    let id = nextOfferId;
    nextOfferId += 1;
    let letterText = generateOfferText(candidateName, jobTitle, salary, startDate, clauses);
    let offer : OfferLetter = {
      id;
      candidateId;
      jobId;
      salary;
      startDate;
      clauses;
      status = #pending;
      letterText;
      createdAt = Time.now();
    };
    offerLetters.add(id, offer);
    id;
  };

  public shared ({ caller }) func updateOfferStatus(id : Nat, status : OfferStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update offer status");
    };
    switch (offerLetters.get(id)) {
      case (null) Runtime.trap("Offer letter not found");
      case (?existing) {
        let updated : OfferLetter = {
          id = existing.id;
          candidateId = existing.candidateId;
          jobId = existing.jobId;
          salary = existing.salary;
          startDate = existing.startDate;
          clauses = existing.clauses;
          status;
          letterText = existing.letterText;
          createdAt = existing.createdAt;
        };
        offerLetters.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteOfferLetter(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete offer letters");
    };
    if (not offerLetters.containsKey(id)) {
      Runtime.trap("Offer letter not found");
    };
    offerLetters.remove(id);
  };

  public query ({ caller }) func getOfferLetter(id : Nat) : async ?OfferLetter {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view offer letters");
    };
    offerLetters.get(id);
  };

  public query ({ caller }) func listOfferLetters() : async [OfferLetter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list offer letters");
    };
    let result = List.empty<OfferLetter>();
    for ((_, o) in offerLetters.entries()) {
      result.add(o);
    };
    result.toArray();
  };

  public query ({ caller }) func getOffersByCandidate(candidateId : Nat) : async [OfferLetter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list offer letters");
    };
    let result = List.empty<OfferLetter>();
    for ((_, o) in offerLetters.entries()) {
      if (o.candidateId == candidateId) result.add(o);
    };
    result.toArray();
  };

  public query ({ caller }) func getAnalytics() : async AnalyticsResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view analytics");
    };

    var totalOpenJobs : Nat = 0;
    for ((_, job) in jobRequisitions.entries()) {
      if (job.status == #open) totalOpenJobs += 1;
    };

    let jobCandidateCount = Map.empty<Nat, Nat>();
    for ((_, c) in candidates.entries()) {
      for (jid in c.appliedJobIds.values()) {
        let current = switch (jobCandidateCount.get(jid)) {
          case (null) 0;
          case (?n) n;
        };
        jobCandidateCount.add(jid, current + 1);
      };
    };
    let perJobList = List.empty<(Nat, Nat)>();
    for ((jid, count) in jobCandidateCount.entries()) {
      perJobList.add((jid, count));
    };

    var countNew : Nat = 0;
    var countScreening : Nat = 0;
    var countShortlisted : Nat = 0;
    var countInterview : Nat = 0;
    var countOffer : Nat = 0;
    var countHired : Nat = 0;
    var countRejected : Nat = 0;
    for ((_, c) in candidates.entries()) {
      switch (c.status) {
        case (#new) { countNew += 1 };
        case (#screening) { countScreening += 1 };
        case (#shortlisted) { countShortlisted += 1 };
        case (#interview) { countInterview += 1 };
        case (#offer) { countOffer += 1 };
        case (#hired) { countHired += 1 };
        case (#rejected) { countRejected += 1 };
      };
    };
    let stageList : [(Text, Nat)] = [
      ("New", countNew),
      ("Screening", countScreening),
      ("Shortlisted", countShortlisted),
      ("Interview", countInterview),
      ("Offer", countOffer),
      ("Hired", countHired),
      ("Rejected", countRejected),
    ];

    var totalHireDays : Int = 0;
    var hiredCount : Nat = 0;
    for ((_, c) in candidates.entries()) {
      if (c.status == #hired) {
        var hiredTime : ?Time.Time = null;
        for (t in c.pipelineLog.values()) {
          if (t.toStatus == #hired) hiredTime := ?t.timestamp;
        };
        switch (hiredTime) {
          case (null) {};
          case (?ht) {
            let diffNs : Int = ht - c.createdAt;
            let diffDays : Int = diffNs / (86_400_000_000_000);
            totalHireDays += diffDays;
            hiredCount += 1;
          };
        };
      };
    };
    let avgTimeToHire : Float = if (hiredCount == 0) {
      0.0;
    } else {
      totalHireDays.toFloat() / hiredCount.toFloat();
    };

    let scoredList = List.empty<(Nat, Nat)>();
    for ((_, c) in candidates.entries()) {
      var maxScore : Nat = 0;
      for ((_, score) in c.matchScores.values()) {
        if (score > maxScore) maxScore := score;
      };
      if (maxScore > 0) scoredList.add((c.id, maxScore));
    };
    let scoredArr = scoredList.toArray();
    let sorted = scoredArr.sort(
      func(a, b) {
        if (b.1 > a.1) { #less } else if (b.1 < a.1) { #greater } else { #equal };
      }
    );
    let top10 = if (sorted.size() <= 10) { sorted } else { sorted.sliceToArray(0, 10) };

    {
      totalOpenJobs;
      totalCandidatesPerJob = perJobList.toArray();
      candidatesPerStage = stageList;
      averageTimeToHireDays = avgTimeToHire;
      topScoringCandidates = top10;
      last30DaysApplications = [];
      pipelineStageDistribution = stageList;
      topJobsByVolume = perJobList.toArray();
      avgTimeToHirePerJob = [];
    };
  };

  // ── New Interview Scheduling API with Consistent Types ────────────────────

  public shared ({ caller }) func createInterview2(interview : InterviewInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can schedule interviews");
    };
    let candidateName = switch (candidates.get(interview.candidateId)) {
      case (null) Runtime.trap("Candidate not found");
      case (?c) c.name;
    };
    let jobTitle = switch (jobRequisitions.get(interview.jobId)) {
      case (null) Runtime.trap("Job not found");
      case (?j) j.title;
    };
    let id = nextInterviewId;
    nextInterviewId += 1;
    let newInterview : Interview = {
      id;
      candidateId = interview.candidateId;
      candidateName;
      jobId = interview.jobId;
      jobTitle;
      dateTime = interview.dateTime;
      interviewer = interview.interviewer;
      interviewType = interview.interviewType;
      status = #scheduled;
      notes = interview.notes;
    };
    interviews.add(id, newInterview);
    id;
  };

  public shared ({ caller }) func updateInterview2(
    id : Nat,
    dateTime : Time.Time,
    interviewer : Text,
    interviewType : InterviewType,
    status : InterviewStatus,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update interviews");
    };

    switch (interviews.get(id)) {
      case (null) Runtime.trap("Interview not found");
      case (?existing) {
        let updated : Interview = {
          id;
          candidateId = existing.candidateId;
          candidateName = existing.candidateName;
          jobId = existing.jobId;
          jobTitle = existing.jobTitle;
          dateTime;
          interviewer;
          interviewType;
          status;
          notes;
        };
        interviews.add(id, updated);
      };
    };
  };
};
