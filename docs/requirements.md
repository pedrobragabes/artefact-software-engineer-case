# Requirements and validation plan

The supplied two-page case is the requirements source. The corporate PDF is intentionally not redistributed.

| Requirement                          | Planned implementation                                            | Acceptance evidence                                     |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------- |
| Next.js v15 and React                | App Router, strict TypeScript; latest available stable 15.x patch | Dependency lockfile, typecheck and production build     |
| Frontend consumes tRPC               | Typed HTTP client and App Router fetch adapter                    | Browser CRUD against production server                  |
| Task fields                          | Server UUID, titulo, optional descricao, ISO 8601 dataCriacao     | Router tests; client cannot set ID/date                 |
| In-memory data                       | One process-local store shared by SSR and HTTP                    | Create over HTTP, retrieve through server-rendered HTML |
| Create/list/update/delete            | Four tasks procedures with Zod input validation                   | Automated router and HTTP tests                         |
| Required title and meaningful errors | Trimmed nonempty title; BAD_REQUEST and NOT_FOUND                 | Invalid input and missing-task tests                    |
| Initial list uses SSR                | Dynamic Server Component calls tRPC directly                      | Raw HTML and JavaScript-disabled browser contain task   |
| Delete from list with feedback       | Client delete button and refresh                                  | Browser success/error/loading checks                    |
| Create/edit forms and hooks          | Shared functional form with local state                           | Browser create/edit/validation tests                    |
| Loading, success and failure         | Accessible status/alert messages and disabled pending controls    | Browser tests, including intercepted failure/delay      |
| Simple usable layout                 | Responsive CSS, labels, focus indicators                          | Mobile viewport and keyboard checks                     |
| Documentation (bonus)                | README with setup, architecture and limitations                   | Follow documented commands                              |
| Infinite scroll (bonus)              | Deliberately excluded                                             | No mandatory acceptance dependency                      |
| Public GitHub delivery               | Prepared milestone and issues; publish only after authorization   | Pending explicit remote authorization                   |
| Theoretical questions                | Learning outline for candidate-written answers                    | Candidate draft review; final PDF separately requested  |

## Resolved ambiguities

- “Latest versions” is interpreted within the explicitly required Next.js 15 major.
- Timestamps use UTC ISO 8601 strings, avoiding a serialization library.
- Update requires the complete editable form (title and optional description). Omitted description clears it.
- List ordering is newest creation timestamp first, then UUID ascending for ties.
- CSS is sufficient for this small interface; Tailwind is optional in the brief.
- Use the vanilla tRPC client for mutations and router.refresh for server-owned list data. No client query cache is needed.
- Local single-process Node.js is the execution target. Restart loses data; multiple instances do not share it.
