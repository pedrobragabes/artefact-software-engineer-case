# Final MVP audit

Date: November 1, 2026. Baseline: `4649769`, plus the empty-state copy refinement committed with this report. Scope: the official two-page case, all practical requirements and both bonuses. Theoretical answers remain deferred by the candidate.

## Conclusion

The practical MVP passes the checks below. No architecture change or new feature is needed. The only application change in this audit removes repeated empty-state text. Dates already use semantic `time` elements, ISO timestamps, and an explicit UTC label, so their presentation was preserved.

This is evidence for local, single-process use in the tested environment, not a production-security or comprehensive accessibility certification.

## Evidence key

- **B1-B10**: the ten tests in `tests/tasks.test.ts`, in source order.
- **E1-E12**: the twelve tests in `tests/e2e/tasks.spec.ts`, in source order.
- **M1**: supplementary production lifecycle check on isolated ports 3104 and 3105: create over tRPC, read and verify script-stripped SSR HTML three times, verify another process has an empty list, restart the first process, verify an empty list and `NOT_FOUND` for the old ID. Passed. Test-owned processes were stopped.
- **U1**: supplementary browser check on port 3106: list and form at 320, 375, 768, and 1280 pixels; no horizontal overflow; visible 3px keyboard focus; semantic ISO datetime and UTC text; one empty-state heading; feedback cleared after navigating to New Task and canceling. Passed. Empty desktop and 320px form screenshots were visually inspected. Only fictional audit tasks were created and removed.
- **G1**: GitHub API/CLI repository, issue, milestone, and branch inspection.
- **S1**: manual tracked-file review and common private-key/token pattern scan over all six pre-audit commits. No matches. The scan is bounded evidence, not a guarantee that any possible secret would be detected.

## Official requirement matrix

| Official requirement                                                | Implementation file(s)                                                                           | Evidence actually executed                                                                                                                          | Result                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Part 1.1a: explain CSR, SSR, SSG                                    | Candidate's separate response                                                                    | No theory submission reviewed                                                                                                                       | Deferred; not approved                                  |
| Part 1.1b: benefits, problems and examples                          | Candidate's separate response                                                                    | No theory submission reviewed                                                                                                                       | Deferred; not approved                                  |
| Part 1.2a: backend approaches                                       | Candidate's separate response                                                                    | No theory submission reviewed                                                                                                                       | Deferred; not approved                                  |
| Part 1.2b: tRPC security, typing and scalability                    | Candidate's separate response                                                                    | No theory submission reviewed                                                                                                                       | Deferred; not approved                                  |
| Next.js v15, current versions                                       | `package.json`, `package-lock.json`                                                              | Installed Next.js 15.5.28; npm registry lists it as the latest stable 15.x patch; production build passed                                           | Pass within the explicitly required v15 major           |
| Frontend consumes tRPC endpoints                                    | `src/lib/trpc-client.ts`, `src/app/api/trpc/[trpc]/route.ts`, `src/server/routers/tasks.ts`      | E1 performs real browser CRUD through HTTP; E9 verifies HTTP errors                                                                                 | Pass                                                    |
| Unique ID, required title, optional description, creation timestamp | `src/lib/task-schema.ts`, `src/server/store/tasks.ts`                                            | B1, B3, B4: unique IDs, valid timestamp, optional description, server-owned fields, immutable ID/date on update                                     | Pass                                                    |
| Create task via tRPC                                                | `src/server/routers/tasks.ts`, `src/components/task-form.tsx`                                    | B1-B3 and E1                                                                                                                                        | Pass                                                    |
| List tasks via tRPC                                                 | `src/server/routers/tasks.ts`, `src/server/store/tasks.ts`                                       | B1, B8-B9 and E2/E10                                                                                                                                | Pass                                                    |
| Update task via tRPC                                                | `src/server/routers/tasks.ts`, `src/components/task-form.tsx`                                    | B4-B5, E1, E5, E10, including a task beyond the first page                                                                                          | Pass                                                    |
| Delete task via tRPC                                                | `src/server/routers/tasks.ts`, `src/components/task-list.tsx`                                    | B5-B6, E1, E5-E6, E10                                                                                                                               | Pass                                                    |
| In-memory storage, no database needed                               | `src/server/store/tasks.ts`                                                                      | B7 isolation/copy protection, E1 reload, M1 same-process retention, process isolation and restart loss; source contains no task persistence adapter | Pass                                                    |
| Reject tasks without a title                                        | `src/lib/task-schema.ts`, `src/server/routers/tasks.ts`                                          | B2 rejects missing, empty, whitespace and wrong-type titles; E3 tests form validation; E9 bypasses the form over HTTP                               | Pass                                                    |
| Meaningful failure errors                                           | `src/server/routers/tasks.ts`, `src/server/trpc.ts`, `src/lib/error-message.ts`                  | B5-B6/B10 and E5/E7/E9: BAD_REQUEST, NOT_FOUND, no API stack traces, readable UI messages                                                           | Pass                                                    |
| SSR initial task list                                               | `src/app/page.tsx`, `src/components/task-list.tsx`                                               | E2 checks task text in script-stripped HTML and a JavaScript-disabled browser; E10 checks the first page; M1 repeats server reads                   | Pass; initial ten tasks are server-rendered             |
| Simple task layout                                                  | `src/components/task-list.tsx`, `src/app/globals.css`                                            | E8 and U1; desktop/mobile visual inspection                                                                                                         | Pass                                                    |
| Delete directly from list with visual feedback                      | `src/components/task-list.tsx`                                                                   | E1, E5-E6: successful, stale, pending and network-failed deletion                                                                                   | Pass                                                    |
| Create/update forms                                                 | `src/components/task-form.tsx`, `src/app/tasks/new/page.tsx`, `src/app/tasks/[id]/edit/page.tsx` | E1 prefilled edit, creation, description clearing, save; E10 later-page edit                                                                        | Pass                                                    |
| Functional components and hooks for form state                      | `src/components/task-form.tsx`                                                                   | Source review: functional component, useState/useTransition; E1/E3/E4 exercises state                                                               | Pass                                                    |
| Form validation                                                     | `src/components/task-form.tsx`, `src/lib/task-schema.ts`                                         | E3 empty/whitespace rejection; B2/B4 server validation remains independent                                                                          | Pass                                                    |
| Frontend/backend error feedback                                     | `src/lib/error-message.ts`, `src/components/task-form.tsx`, `src/components/task-list.tsx`       | E3-E7, E9, E11: validation, network failure, retry and missing-task errors                                                                          | Pass                                                    |
| Loading, success and failure experience                             | `src/components/task-form.tsx`, `src/components/task-list.tsx`, `src/app/loading.tsx`            | E1/E4/E6/E10/E11: pending controls, success, errors; E1/E10/U1: success consumed after navigation/reload                                            | Pass for exercised flows                                |
| Bonus: infinite scroll                                              | `src/components/task-list.tsx`, `src/server/store/tasks.ts`, `src/lib/task-schema.ts`            | B8-B9 validates cursor boundaries and inputs; E10 loads 10/20/23 tasks without duplicates; E11 retry; E12 manual fallback                           | Pass                                                    |
| Bonus: comments/documentation                                       | `README.md`, `src/server/store/tasks.ts`, `src/components/task-list.tsx`                         | Comments explain singleton/cursor/feedback decisions; documented lint/typecheck/tests/build commands executed successfully                          | Pass                                                    |
| Public GitHub repository link                                       | Repository on GitHub, `main` branch                                                              | G1 confirms public visibility and remote main                                                                                                       | Pass                                                    |
| No sensitive information; fictional examples                        | `.gitignore`, tracked source/tests/docs and Git history                                          | S1 found no credential patterns or tracked PDFs/.env/build output; examples are fictional; see publication caveats below                            | Checked with caveats; not an absolute privacy guarantee |

## Command results

Executed again during this audit on Windows, Node.js 26.12.0 and npm 11.20.0:

| Command                | Result                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `npm run lint`         | Exit 0; no lint warnings/errors                                                 |
| `npm run typecheck`    | Exit 0                                                                          |
| `npm test`             | 10 passed, 0 failed                                                             |
| `npm run build`        | Exit 0; homepage/edit page dynamic                                              |
| `npm run test:e2e`     | 12 passed, 0 failed, Chromium against production server                         |
| `npm audit --omit=dev` | 0 reported vulnerabilities                                                      |
| `npm audit --json`     | 14 moderate development-tooling findings; no high/critical findings             |
| `npm ls --depth=0`     | All declared direct packages installed; no missing/extraneous packages reported |
| `git diff --check`     | No whitespace errors                                                            |

M1 and U1 are supplementary audit checks, not additional tests counted in the 22-test suite. Their temporary scripts and screenshots are local audit artifacts, excluded from Git.

## Accessibility, layout and dependency review

The interface has English document language, landmarks, labels/help text, status/alert regions, a skip link, visible focus and native buttons. Keyboard form completion and manual pagination passed. List/form overflow checks passed at four widths. Audited text/background color pairs range from 5.08:1 to 13.68:1; this does not certify every possible state. No screen-reader session or other browser engine was tested.

Every direct dependency has a current purpose: Next/React render the app; tRPC provides the client/server contract; Zod validates; TypeScript and type packages check types; ESLint/FlatCompat/Next config lint; tsx runs backend tests; Playwright tests Chromium; Prettier formats source/docs. No unused direct dependency or obsolete source file was identified. No dependency or architecture changes were made.

The remaining npm audit findings involve the development lint chain (minimatch and affected dependants). The compatible ESLint 9 line is unsupported upstream. They are a documented tooling limitation; the audit does not claim all dependencies are vulnerability-free. No forced upgrade was performed as part of closing this MVP.

## Memory limitations confirmed

- Tasks survive requests and browser reloads within the same process.
- Restarting the process loses all tasks; M1 verified this directly.
- Two processes have independent stores; M1 verified this directly.
- Runtime replacement or development reloads can reset data; hot-reload durability is not promised or newly certified.
- No authentication, conflict detection, storage quotas or live cross-tab synchronization is implemented. These are out of scope.

## GitHub and public-file caveats

Repository: https://github.com/pedrobragabes/artefact-software-engineer-case

Issues #1-#6 are individually CLOSED, all assigned to the sole milestone `v1.0 — Technical Case MVP`, which is CLOSED. Querying open issues for milestone 1 returned an empty array. However, the milestone aggregate API still reports `open_issues: 1` and `closed_issues: 5`. This metadata inconsistency is recorded rather than presented as a clean 6/6 aggregate. No issue was reopened to manufacture activity.

The current tree contains only application/configuration files, tests, README and technical verification documents. Study/planning files are preserved locally in the sibling notes folder, but their earlier versions remain accessible in prior public commits. They were removed from the current tree, not purged from history. No history rewrite was performed. Git author metadata also contains the real author identity configured and authorized by the candidate; it is not fictional sample data.

No corporate PDF, private key, environment secret or real customer task data was found in the audited tracked content. A pattern scan cannot prove the absence of every possible sensitive value.

## Closing recommendation

Close practical MVP development and study the existing implementation. The tested practical requirements and both bonuses are satisfied. Keep the explicitly documented limitations and GitHub metadata/history caveats visible. Theoretical answers remain outside this audit's approval.
