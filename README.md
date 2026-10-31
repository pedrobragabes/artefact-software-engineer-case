# Task Manager

A minimal task management application for the Artefact Software Engineer technical case, built with Next.js 15, React, TypeScript, and tRPC.

## Features

- Create, list, edit, and delete tasks through tRPC.
- Server-rendered initial list, with task data stored only in server memory.
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

The homepage is a dynamic Server Component. It calls `tasks.list` directly through a tRPC server-side caller, so tasks are present in the initial HTML, including with JavaScript disabled. Client Components handle mutations through HTTP and call `router.refresh()` after success. There is no separate client query cache.

Create/edit feedback travels through a `success` URL parameter. Once displayed, the browser removes that parameter with `history.replaceState`, without fetching the list again. The message remains visible for that visit and does not return after reload. JavaScript is required for mutations and consuming the parameter.

A process-local `globalThis` singleton shares storage between page and route-handler bundles. The store factory creates isolated instances for tests; returned copies protect stored data from accidental mutation. The edit page finds its task in the list, keeping the API at four procedures for this small dataset.

## API and validation

Endpoint: `/api/trpc`. Field names follow the case specification.

| Procedure      | Input                        | Result                  |
| -------------- | ---------------------------- | ----------------------- |
| `tasks.create` | `{ titulo, descricao? }`     | Created task            |
| `tasks.list`   | None                         | Task array              |
| `tasks.update` | `{ id, titulo, descricao? }` | Updated task            |
| `tasks.delete` | `{ id }`                     | `{ id, deleted: true }` |

A task has `id`, `titulo`, optional `descricao`, and `dataCriacao`. The server generates UUIDs and UTC ISO timestamps; editing preserves both. Tasks sort by creation time descending, then UUID ascending for ties. Dates display in UTC.

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

Backend tests cover CRUD, validation, server-generated fields, ordering, missing IDs, and store isolation. Browser tests cover CRUD, consumed success feedback, data after reload, SSR in raw HTML and without JavaScript, pending/error states, retries, stale tasks, mobile layout, and keyboard navigation. See [verification](docs/verification.md) and the [requirements matrix](docs/requirements.md).

## Decisions and limitations

- One application, four procedures, and plain CSS keep the implementation small. Infinite scroll is optional and intentionally omitted.
- Data is volatile and not shared between processes or serverless instances. A singleton is not persistence; runtime replacement can reset it.
- There is no authentication, authorization, pagination, storage quota, conflict detection, or live synchronization across tabs. Concurrent edits use the last successful write.
- Only Chromium and the stated Node.js version were tested. Basic accessibility checks are not a full audit.
- Next.js 15 requires a compatible lint toolchain. The full npm audit has outstanding moderate development-tooling findings; production dependencies audit clean at verification time.
- The PostCSS override to 8.5.32 addresses transitive advisories while retaining Next.js 15. No application dependency was added for this review.

A production service would need durable storage, access controls, and broader operational testing. Those changes are outside this case.
