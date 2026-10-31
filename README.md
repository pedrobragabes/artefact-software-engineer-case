# Task Manager

A minimal task management application built with Next.js 15, TypeScript, and tRPC for the Artefact Software Engineer technical case.

## Features

- Create, list, edit, and delete tasks.
- Initial task list rendered on the server for every request.
- Required title, optional description, and server-generated ID and creation time.
- Responsive forms with validation and loading, success, and error feedback.
- Process-local in-memory storage. No database, login, environment variables, or external service required.

## Tech stack

Next.js 15 App Router and React; strict TypeScript; tRPC v11 for typed procedures; Zod for runtime validation; plain CSS for styling. Node's test runner with tsx covers backend behavior; Playwright covers Chromium browser flows against a production server. Exact versions are recorded in `package.json` and `package-lock.json`.

## Getting started

Prerequisites: Node.js 22 or newer and npm. Validation was performed with Node.js 26.12.0 and npm 11.20.0 on Windows. Other supported Node versions have not been separately tested.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No `.env` file is needed. Start with an empty task list and create fictional sample tasks.

Production:

```sh
npm run build
npm start
```

The server binds to loopback by default. Run one Node.js process for predictable in-memory behavior. Stop it with Ctrl+C; tasks are lost on restart.

## Project structure

```text
src/app/                  Pages, layout, error/loading boundaries, and CSS
src/app/api/trpc/[trpc]/   tRPC HTTP route handler
src/components/           Interactive task list and shared form
src/lib/                  Validation schema, typed client, safe error messages
src/server/routers/       tRPC application and task routers
src/server/store/         In-memory task store
src/server/trpc.ts        Context and error formatting
tests/                    Backend tests and browser tests
docs/                     Requirements, delivery audit, GitHub and learning plans
```

## Architecture

The homepage is a dynamic Server Component. It calls `tasks.list` using a tRPC server-side caller and passes the result to the interactive list. Next.js renders that list in the initial HTML; it is visible even with JavaScript disabled. It does not wait for a browser `useEffect` fetch.

Client Components handle form state and button interactions. Mutations travel through the typed tRPC HTTP client to the Next.js fetch adapter, then through Zod validation to the task store. Successful mutations navigate as needed and call `router.refresh()` to obtain fresh server data. No duplicate client query cache is maintained. JavaScript is required for mutations.

A `globalThis` singleton lets page and route-handler bundles share the same store within a Node.js process. Store factories also allow isolated tests. The store returns copies so callers cannot mutate stored tasks accidentally. The edit page reads the list and locates the task; this linear lookup keeps the API at four procedures and is appropriate for the small dataset.

## API procedures

Endpoint: `/api/trpc`. Contract field names intentionally match the case.

| Procedure      | Kind     | Input                        | Result                  |
| -------------- | -------- | ---------------------------- | ----------------------- |
| `tasks.create` | Mutation | `{ titulo, descricao? }`     | Created task            |
| `tasks.list`   | Query    | None                         | Task array              |
| `tasks.update` | Mutation | `{ id, titulo, descricao? }` | Updated task            |
| `tasks.delete` | Mutation | `{ id }`                     | `{ id, deleted: true }` |

Task: `{ id: string, titulo: string, descricao?: string, dataCriacao: string }`.

IDs are UUIDs generated on the server. Creation dates are UTC ISO 8601 timestamps and remain unchanged when editing. Dates are displayed in UTC consistently on server and client. Listing sorts by creation date descending, then UUID ascending for timestamp ties.

Update replaces the editable fields; omitting the description clears it. Client-supplied creation dates, create IDs, and other unknown properties are rejected.

## Validation and error handling

The shared Zod schema trims text, rejects blank titles, and limits title/description to 200/5,000 characters. The UI validates before sending; the backend independently validates every input. Invalid input produces `BAD_REQUEST`; a well-formed but absent task ID produces `NOT_FOUND`. Neither failure is reported as success.

Fields have visible labels and help text. Feedback uses status/alert regions. Pending operations disable relevant controls; failed submissions retain entered values. The UI shows safe messages, and API error responses omit stack traces. Missing edit routes display a not-found page. Unexpected rendering failures have a retry boundary.

## Testing

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

The browser suite starts and stops its own `next start` server on port 3100. Keep that port free; the suite intentionally refuses to reuse another server. Tests clear the test server's in-memory tasks before each test. Never point them at a shared server.

Backend tests cover valid/invalid input, optional descriptions, server-owned fields, deterministic listing, update preservation, deletion, missing IDs, and store isolation. Browser tests cover CRUD, reload, SSR without JavaScript, form validation, pending controls, retry after network failure, stale-task errors, missing routes, mobile overflow, keyboard navigation, and HTTP error formatting. Chromium is the tested browser; no cross-browser or full accessibility certification is claimed.

See [delivery audit](docs/delivery-audit.md) for executed results and remaining work.

## Technical decisions and trade-offs

- **One application:** Next.js hosts the UI and tRPC, avoiding a second service.
- **Server-owned list:** Dynamic SSR plus refresh keeps reads straightforward. The vanilla tRPC client means local loading/error state is explicit. TanStack Query would be useful if client caching or background fetching became necessary.
- **Plain CSS:** A small interface does not require a component library or styling framework.
- **ISO timestamps:** JSON-safe strings avoid an additional transformer.
- **PostCSS override:** Next.js 15 pins an older transitive PostCSS. An override to 8.5.32 addresses reported advisories while retaining the required Next.js major; production build and browser tests validate this combination.
- **No infinite scroll:** Optional scope was excluded to focus on mandatory behavior.

Reference documentation: [tRPC server-side calls](https://trpc.io/docs/server/server-side-calls), [tRPC vanilla client and trade-offs](https://trpc.io/docs/client/vanilla), and [Next.js 15 route segment configuration](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config).

## Known limitations

- Data is volatile and is lost when the process restarts. Module reloads or runtime replacement can also reset it; the singleton is not a persistence guarantee.
- Different processes, workers, and serverless instances have separate stores. This design is for local single-process execution.
- No authentication or authorization: anyone who can reach the server can modify all tasks. Use fictional data only.
- No live synchronization between tabs, conflict detection, or pagination. Concurrent edits use the last successful write.
- There are no storage quotas or production abuse controls.
- The development lint dependency chain has outstanding moderate npm audit findings. Production dependencies audited clean at verification time; details are in the delivery audit.

## Future improvements

For a real production service, first add durable storage, authentication/authorization, request limits, and concurrency handling. Expand integration, accessibility, and cross-browser tests. These are intentionally outside this case's implementation.

## Delivery and learning

[Requirements matrix](docs/requirements.md) maps the case to validation. [GitHub plan](docs/github-plan.md) contains one milestone and five issue drafts awaiting remote authorization. [Interview guide](docs/interview-guide.md) provides prompts for candidate-written theoretical answers. No corporate PDF or final application PDF is included, and no license has been selected.
