# Task Manager

A minimal task management application for the Artefact Software Engineer technical case, built with Next.js 15, React, TypeScript, and tRPC.

## Features

- Create, list, edit, and delete tasks through tRPC.
- Server-rendered first page, with task data stored only in server memory.
- Infinite scroll with ten tasks per page, error retry, and a keyboard-accessible Load More button.
- Shared create/edit form with validation, pending states, and success/error feedback.
- Responsive layout, labeled fields, keyboard focus indicators, and accessible feedback regions.

## Run locally

Use Node.js 22 or newer and npm. Verified on Windows with Node.js 26.12.0 and npm 11.20.0.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No environment variables or external services are required.

For production mode:

```sh
npm run build
npm start
```

Both servers bind to loopback. Run a single Node.js process and use fictional data. Stopping the server loses all tasks.

## Architecture

Next.js App Router hosts the frontend and tRPC HTTP handler. TypeScript checks the contract at compile time; Zod validates inputs at runtime. The interface uses plain CSS.

- `src/app/`: pages, layout, styles, error/loading boundaries, and `/api/trpc` route.
- `src/components/`: interactive task list and shared create/edit form.
- `src/lib/`: validation schema, typed tRPC client, and user-facing error messages.
- `src/server/`: tRPC procedures and in-memory task store.
- `tests/`: backend and production browser tests.

The homepage is a dynamic Server Component. It calls `tasks.list` directly through a tRPC server-side caller, so the first ten tasks are present in the initial HTML, including with JavaScript disabled. An IntersectionObserver loads the next page when the Load More button enters the viewport. The button also works manually if the observer is unavailable. Client Components handle mutations through HTTP and call `router.refresh()` after success. Additional pages are kept in local component state. A server refresh resets pagination and cancels any outdated page request.

Create/edit feedback travels through a `success` URL parameter. Once displayed, the page keeps the message in local state and removes the parameter with `router.replace`, keeping Next.js navigation in sync with the address bar. The message remains visible for that visit and does not return after reload. JavaScript is required for mutations and consuming the parameter.

A process-local `globalThis` singleton shares storage between page and route-handler bundles. The store factory creates isolated instances for tests; returned copies protect stored data from accidental mutation. The edit page uses `tasks.get` to read one task by ID, including tasks beyond the first page.

## API and validation

Endpoint: `/api/trpc`. Field names follow the case specification.

| Procedure      | Input                            | Result                  |
| -------------- | -------------------------------- | ----------------------- |
| `tasks.create` | `{ titulo, descricao? }`         | Created task            |
| `tasks.list`   | `{ limit?, cursor? }` (optional) | `{ items, nextCursor }` |
| `tasks.get`    | `{ id }`                         | Task                    |
| `tasks.update` | `{ id, titulo, descricao? }`     | Updated task            |
| `tasks.delete` | `{ id }`                         | `{ id, deleted: true }` |

A task has `id`, `titulo`, optional `descricao`, and `dataCriacao`. The server generates UUIDs and UTC ISO timestamps; editing preserves both. Tasks sort by creation time descending, then UUID ascending for ties. Dates display in UTC.

List defaults to ten tasks and accepts limits from 1 to 50. `nextCursor` contains the last task's `{ id, dataCriacao }`, or is `null` at the end. Using these immutable values instead of an array offset means deleting a previous task does not skip entries on the next page. Newer tasks added in another tab appear after a refresh. Pagination reduces response size; the small in-memory store still sorts its contents for each read.

Titles are trimmed, required, and limited to 200 characters. Descriptions are trimmed and limited to 5,000 characters. Update replaces the editable fields; omitting the description clears it. Unknown fields and invalid IDs are rejected. Invalid input returns `BAD_REQUEST`; absent tasks return `NOT_FOUND`.

The form validates before submission, and the server independently validates every input. Failed requests retain form values. User-facing errors are safe, API responses omit stack traces, and missing edit routes show a not-found page.

## Tests

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

The browser suite starts its own production server on port 3100 and clears that server's tasks between tests. Keep the port free. It never reuses a running server.

Backend tests cover CRUD, validation, server-generated fields, ordering, missing IDs, and store isolation. Browser tests cover CRUD, consumed success feedback, data after reload, SSR in raw HTML and without JavaScript, pending/error states, retries, stale tasks, mobile layout, keyboard navigation, incremental loading, and retry after a page-fetch error. See [verification](docs/verification.md) and the [requirements matrix](docs/requirements.md).

## Decisions and limitations

- One application and plain CSS keep the implementation small. Infinite scroll uses browser APIs and the existing tRPC client, with no additional library.
- Data is volatile and not shared between processes or serverless instances. A singleton is not persistence; runtime replacement can reset it.
- There is no authentication, authorization, storage quota, conflict detection, or live synchronization across tabs. Concurrent edits use the last successful write.
- Only Chromium and the stated Node.js version were tested. Basic accessibility checks are not a full audit.
- Next.js 15 requires a compatible lint toolchain. The full npm audit has outstanding moderate development-tooling findings; production dependencies audit clean at verification time.
- The PostCSS override to 8.5.32 addresses transitive advisories while retaining Next.js 15. No application dependency was added for this review.

A production service would need durable storage, access controls, and broader operational testing. Those changes are outside this case.
