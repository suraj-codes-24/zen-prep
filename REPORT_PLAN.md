# ZenPrep Technical Report Plan

Updated: 2026-04-17

This file is the living outline for the formal ZenPrep project report. It now reflects the real codebase and the latest product fixes instead of the earlier pre-implementation draft.

## Report Goal

Produce a technical report that can support:

- college or portfolio submission
- architecture handoff
- deployment and maintenance onboarding
- feature walkthroughs backed by the current codebase

## Current Status

- Core product implementation: done
- Deployment path: done and documented
- Demo data for screenshots: available
- Report writing: not written yet
- Report scope and chapter facts: verified through the codebase on 2026-04-17

## Recommended Deliverables

1. A full technical report in Markdown or Word export.
2. A diagram pack covering architecture, flows, and database relationships.
3. A screenshot appendix using the seeded demo account.
4. A deployment appendix based on the current Vercel + Hugging Face + Neon setup.

## Suggested Report Size

Target: 60-80 pages

This is leaner than the original 90+ page estimate and better matches the real project without padding.

## Proposed Chapters

### 1. Introduction
- Problem statement
- Why interview prep needs multimodal feedback
- ZenPrep goals and user types

### 2. Product Scope
- Interview
- Coding
- Communication
- GD
- Career AI
- Analytics and reports

### 3. System Architecture
- React frontend
- FastAPI backend
- PostgreSQL database
- External AI services
- Audio and vision pipelines

### 4. Database Design
- Main entities
- Session ownership by user
- Interview, coding, communication, and GD storage
- Verification and auth tables

### 5. Authentication And Account Flows
- Email/password login
- Google OAuth
- Email verification
- JWT-protected routes

### 6. Interview Engine
- Session creation
- Adaptive question flow
- Answer submission
- NLP scoring
- Voice scoring
- Face scoring
- Follow-up questions
- Finish and replay flow

### 7. Coding Module
- Problem bank
- Language support
- Execution strategy
- Submission scoring
- Safety constraints

### 8. Communication Test
- Section model
- TTS playback
- Audio answer scoring
- Result calculation and history

### 9. Group Discussion
- Topic setup
- Bot personalities
- Pause and raise-hand logic
- Forced-turn logic
- Ready-script coaching sidebar
- Results and coaching generation

### 10. Career AI
- Resume parsing
- JD gap analysis
- Analytics-informed recommendations

### 11. Analytics And Reporting
- Dashboard aggregation
- Session history
- Module-wise stats
- PDF report generation

### 12. Deployment
- Vercel frontend
- Hugging Face Docker backend
- Neon Postgres
- Environment variables
- Deployment workflow

### 13. Testing, Bugs, And Stability Work
- Build verification
- Startup smoke checks
- Runtime fixes applied
- Known limitations

## Code-Verified Changes That Must Be In The Report

These items were missing from the older plan and should now be included explicitly:

- Interview voice uploads require auth and now send it correctly from the frontend.
- Face analysis is recorded per question and consumed server-side during evaluation.
- Follow-up answers are stored without tripping the duplicate-answer guard.
- Empty interview sessions are marked `abandoned`, not `completed`.
- Interview analytics no longer count communication tests as interviews.
- The GD forced-turn sidebar now includes a `Ready Script` card with copy support.
- The seeded demo account gives data across all major modules for screenshots.

## Diagrams To Prepare

- Full system architecture
- Interview request lifecycle
- Interview evaluation pipeline
- Communication test flow
- GD room turn state machine
- Database ERD
- Deployment topology

## Screenshot Checklist

- Dashboard with populated cards
- Analytics page with cross-module data
- Interview setup and room
- Interview results and replay
- Coding room and submission results
- Communication section screen and report
- GD room with the right-side ready-script card
- GD results and coaching
- Career AI resume or JD output
- Profile page

## Open Decisions

- Final output format: Markdown first, then export to PDF or DOCX
- Diagram tool: Mermaid or draw.io
- Screenshot style: local dev or deployed production
- Audience emphasis: academic documentation or product showcase
