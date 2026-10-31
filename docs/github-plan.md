# GitHub publication plan

Status: local drafts only. No remote repository, milestone, labels, or issues have been created. Remote changes require candidate authorization.

Repository: `artefact-software-engineer-case` (public upon authorized publication).
Do not add a license without discussing it with the candidate.

## Milestone

Title: **v1.0 — Technical Case MVP**

Description: Complete the mandatory requirements of the Artefact Software Engineer technical case, delivering a functional, tested, and documented task management application.

## Issue drafts

### Project setup and tRPC integration

Label: setup

Scope: initialize Next.js 15 and strict TypeScript; configure tRPC and validation; verify frontend/backend communication.

Acceptance: application starts locally, typed tRPC requests work, and TypeScript checks pass.

### Implement in-memory task CRUD

Label: backend

Scope: model, process-local store, four procedures, validation and meaningful errors.

Acceptance: CRUD works; empty/whitespace titles are rejected; invalid and missing IDs have appropriate errors.

### Build SSR task list and forms

Label: frontend

Scope: dynamic initial list, shared create/edit form, list deletion, responsive layout and feedback.

Acceptance: all operations work in the UI, initial HTML contains tasks, and success/error/loading states work.

### Add validation, error handling and tests

Label: testing

Scope: edge cases, router and browser tests, basic accessibility and production build.

Acceptance: relevant tests pass, mandatory flows have no known blocking bugs, and production build succeeds.

### Write documentation and verify delivery

Label: documentation

Scope: English README, architecture, API, setup, limitations and public-delivery audit.

Acceptance: documented setup is reproducible, tracked files contain no credentials, and mandatory requirements are accounted for.

Attach all five issues to the single milestone. Close only after checking their acceptance criteria. If created after local development, describe that timing honestly; do not imply retrospective tracking.
