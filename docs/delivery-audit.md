# Delivery audit

Verification date: October 31, 2026.

## Result

The mandatory practical application requirements are implemented and locally verified. Overall submission remains pending publication, candidate review of the theoretical answers, and the separately requested final PDF. Candidate understanding cannot be established by automated tests.

## Completed requirements

- Next.js 15 App Router, React, strict TypeScript, tRPC v11, and runtime Zod validation.
- Four CRUD procedures, with the exact task contract field names.
- Server-generated UUID and UTC creation timestamp; optional description.
- One process-local in-memory store, without browser/file/database persistence.
- Server-rendered initial task list. An HTTP-created task appeared in the raw response HTML after script elements were excluded, and in Chromium with JavaScript disabled.
- Create and edit pages with a shared form; deletion from the list.
- Client/server validation, missing-task handling, pending controls, success/error feedback, retry after a failed request, and automatic list refresh.
- English interface and documentation, responsive layout, labeled controls, visible keyboard focus, and live feedback regions.
- README, requirements matrix, GitHub drafts, and interview preparation outline.

Infinite scroll is an optional bonus and was intentionally excluded.

## Executed checks

Environment: Windows, Node.js 26.12.0, npm 11.20.0.

| Check                  | Result                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`               | Passed; reproduced installation from lockfile                                                                                    |
| `npm run lint`         | Passed without lint warnings or errors                                                                                           |
| `npm run typecheck`    | Passed; generates Next.js route types before checking                                                                            |
| `npm test`             | 7 passed, 0 failed                                                                                                               |
| `npm run build`        | Passed; homepage and edit page reported as dynamic                                                                               |
| `npm run test:e2e`     | 9 passed, 0 failed, against `next start` on port 3100                                                                            |
| `npm start`            | Started successfully on loopback port 3000                                                                                       |
| Visual review          | Inspected actual desktop empty/list/form screenshots and mobile list/form screenshots; no clipping or overlap found              |
| Keyboard/mobile check  | Form completed through keyboard navigation; no horizontal overflow at 375px with a 200-character unbroken title                  |
| `npm audit --omit=dev` | 0 reported vulnerabilities                                                                                                       |
| Full `npm audit`       | 14 moderate findings in the development lint dependency chain                                                                    |
| Repository review      | No credentials found by manual file review and common private-key/token pattern scan; corporate PDF and local artifacts excluded |

The first browser run had two ambiguous test selectors because Next.js adds its own alert region. Scoping assertions to the task-list region fixed the tests; all nine passed on subsequent runs. The initial typecheck/build identified a missing CSS module declaration, which was added and revalidated.

The full audit findings stem from a minimatch advisory propagated through ESLint tooling. Next.js 15's compatible ESLint 9 line is reported as unsupported by npm. No forced major upgrades or incompatible minimatch overrides were applied. This is a remaining development-tooling limitation, not a claim of zero dependency risk. Recheck advisories before publication. The production PostCSS override is documented in the README.

Browser verification covers Chromium only. Basic visual/keyboard checks are not a full accessibility audit. Multi-process deployment, sustained load, and other Node.js versions were not tested.

## Implemented architecture and limits

Dynamic Server Component -> tRPC caller -> shared in-memory store for initial reads.

Client form/button -> typed tRPC HTTP client -> route handler -> validated procedure -> store for mutations. Successful mutations refresh server-rendered data.

Data is lost on restart and not shared between processes. There is no authentication, durable persistence, conflict detection, live cross-tab synchronization, or storage quota. These are intentionally outside scope. Use fictional sample data and local single-process execution.

## Repository and publication status

Git is initialized locally. Author identity was configured only for this repository with the candidate's supplied email. Local work is grouped into setup/planning, backend/tests, frontend, and browser-tests/documentation commits. No dates or prior activity were fabricated. Commit grouping was performed after local implementation because the initial commit was blocked by missing author identity.

No remote repository, milestone, or issues have been created; no push has occurred. The one milestone and five issue drafts are in `github-plan.md`. Remote publication requires explicit candidate authorization. No license was added. The supplied corporate PDF is not tracked. `.env` files, build output, dependencies, traces, and temporary screenshots are ignored.

## Remaining delivery work

1. Candidate reviews the application and explains the main decisions using the interview guide.
2. Obtain authorization to create the public repository, push commits, and create the planned milestone/issues. Record actual remote URLs and close issues only after confirming acceptance criteria.
3. Review candidate-written theoretical answers. Use the verified public repository URL in the final application PDF.
4. Generate the final PDF only when separately requested. Do not represent this local implementation as a completed public submission.

Useful interview questions: Why is this real SSR? Why validate inputs despite TypeScript? What does `router.refresh()` update? Why does a singleton not make data durable? What happens with two server instances? Where would authentication and a database fit?
