# Specification

## Summary
**Goal:** Build HireIQ, a full-stack AI-powered recruitment management platform on the Internet Computer, with a Motoko backend and a React frontend, offering job requisition management, candidate tracking, AI-based resume parsing and match scoring, a Kanban pipeline, interview scheduling, analytics, offer letter generation, email templates, and an AI chatbot widget.

**Planned changes:**

### Backend (Motoko – single actor)
- Job requisitions CRUD with fields: title, department, location, job type, description, required skills, experience level, status (draft/open/closed/on-hold), and creation timestamp
- Candidate data model CRUD with fields: name, email, phone, resume text, skills, experience years, pipeline status, applied job IDs, AI match score, and timestamps; queryable by job ID
- AI resume parsing using in-canister keyword/pattern matching to extract skills, experience years, education, and previous roles from raw resume text
- AI candidate-to-job match scoring (0–100) based on skill and experience overlap; scores persisted per candidate-job pair
- ATS pipeline with stage transitions (New → Screening → Shortlisted → Interview Scheduled → Offer Extended → Hired / Rejected), transition logs with timestamps and optional recruiter notes, and queries by stage and job
- Interview scheduling CRUD linked to candidate and job with date/time, interviewer, type (phone/video/on-site), status, and notes
- Recruiter analytics queries: total open jobs, candidates per job, candidates per pipeline stage, average time-to-hire, and top-N candidates by AI score
- Email/communication template CRUD with name, subject, body (with placeholders), and category
- Role-based access control for Admin, Recruiter, and Hiring Manager roles with permission enforcement on sensitive operations
- Offer letter generation from candidate ID, job ID, salary, start date, and custom clauses; stored with pending/accepted/declined status and status update operations

### Frontend (React + TypeScript + Tailwind CSS + React Query)
- Sidebar navigation layout with sections: Dashboard, Jobs, Candidates, Pipeline, Interviews, Analytics, Templates, Offers, Settings; top header with HireIQ logo, user role indicator, and notification bell
- Dashboard page with metric cards (open jobs, active candidates, interviews this week, avg time-to-hire), bar chart of candidates per pipeline stage, and top-5 AI-matched candidates list; decorative dashboard banner at the top
- Jobs page with searchable/filterable table, status badges, slide-over create/edit form, inline status changes, and "View Candidates" navigation
- Candidates page with searchable table (AI score, stage badge, applied job), detail panel (parsed profile, skill tags, match score progress bar, stage history, linked interviews), and resume paste area triggering AI parsing
- Kanban Pipeline board with columns per ATS stage, candidate cards (name, job, AI score), drag-and-drop stage transitions with optional note dialog, and job filter
- Interviews page with list and simple calendar toggle, schedule/edit form, status update to completed/cancelled, and upcoming interview highlights
- Analytics page with line chart (applications over 30 days), donut chart (stage distribution), bar chart (top jobs by volume), and time-to-hire table; data via React Query
- Templates page with category-filtered list, create/edit form with placeholder token insertion, and live preview panel
- Offers page with offer list (status badges), generation form, formatted preview, and accept/decline status updates
- Floating AI chatbot widget (site-wide) answering recruitment FAQs with pre-defined intents, job data from backend, and quick-reply suggestions
- Bold dark-mode-first design: deep charcoal/slate background, teal and amber accents, gradient highlights on AI-scored elements, consistent typography and icons
- HireIQ logo used in sidebar and favicon; dashboard banner rendered at the top of the Dashboard page

**User-visible outcome:** Recruiters can manage job postings, track candidates through a visual Kanban pipeline, use AI-powered resume parsing and match scoring, schedule interviews, generate offer letters, view analytics dashboards, manage email templates, and interact with an AI chatbot — all within a polished dark-mode web application.
