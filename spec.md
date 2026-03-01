# Specification

## Summary
**Goal:** Build out three new pages (Interviews, Offers, Analytics) and enhance the existing Dashboard with live recruiter analytics for the HireIQ ATS application.

**Planned changes:**
- Add an **Interviews page** with a list and calendar toggle view of scheduled interviews, a form to schedule/edit interviews, and actions to mark interviews as completed or cancelled
- Add an **Offers page** with a table of offer letters (candidate, job, salary, start date, status badge), a form to generate new offers with custom clauses, a formatted offer letter preview panel, and inline status update actions (accepted/declined)
- Add an **Analytics page** with a line chart (applications over last 30 days), donut chart (pipeline stage distribution), bar chart (top jobs by application volume), and a time-to-hire data table per job
- Enhance the **Dashboard page** with four summary metric cards (open jobs, active candidates, interviews this week, avg time-to-hire), a bar chart of candidates per pipeline stage, and a ranked top-5 AI-matched candidates list
- Add backend endpoints/query functions to support interviews, offers, and analytics data
- All data fetched and persisted via React Query; charts styled consistently with the dark-mode teal/amber theme

**User-visible outcome:** Recruiters can schedule and manage interviews, generate and track offer letters, view rich analytics charts, and see a live summary dashboard with key hiring metrics and top AI-matched candidates.
