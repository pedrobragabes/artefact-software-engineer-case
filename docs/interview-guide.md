# Interview and theory preparation

This is a working outline, not a final answer sheet. Write your own short explanations, then review them against the implementation and references.

## Implementation checkpoints

| Stage      | What we built                                           | Why this approach                                    | Trade-offs                                       | How to explain it in an interview                                                                                                |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Foundation | Next.js App Router, strict types, tRPC HTTP route       | One application and a shared typed contract          | Client and server TypeScript are coupled         | "I kept the frontend and backend in one application so the solution stays easy to run and understand."                           |
| Backend    | Four validated procedures and an isolated store factory | Small, testable business operations                  | Data exists only in one process                  | "TypeScript helps callers at compile time, while Zod checks untrusted input at runtime."                                         |
| Frontend   | Dynamic SSR list, shared form, typed mutations          | HTML contains current tasks; one source of list data | Explicit pending state and full list refresh     | "The server renders the initial tasks. Client components handle interaction and refresh server data after successful mutations." |
| Quality    | Router tests and production browser tests               | Verify rules and real frontend/backend behavior      | Chromium only, no exhaustive accessibility audit | "I tested SSR by creating a task over HTTP and checking both the initial HTML and a browser with JavaScript disabled."           |

## Question 1: rendering strategies

For each strategy, draft three sentences: where/when HTML is produced, a useful scenario, and a limitation.

| Strategy | Concepts to address                                               | Example to assess                        |
| -------- | ----------------------------------------------------------------- | ---------------------------------------- |
| CSR      | Browser execution, initial loading, interactivity, client fetches | A private interactive dashboard          |
| SSR      | Request-time HTML, freshness, server cost, hydration              | A page that needs current task data      |
| SSG      | Build-time HTML, cacheability, stale data and rebuilds            | Documentation or a stable marketing page |

Questions to check your explanation:

1. Does a Client Component necessarily mean the initial page is CSR-only? Inspect the task list.
2. How do Server Components differ from SSR as a rendering strategy?
3. Why would a statically generated task list be incorrect here?
4. What is visible without JavaScript, and which interactions still need it?
5. What changes if a request waits for a slow data source?

## Question 2: backend approaches and tRPC

Separate deployment architecture from API style: a monolith or separate service can expose REST, GraphQL, or RPC; serverless is an execution model. Consider operational complexity, contract management, ecosystem, and clients in other languages. Do not claim one approach is universally best.

Build your tRPC answer around:

- Type inference across the TypeScript boundary; no independently generated client schema in this project.
- Runtime validation versus compile-time types: why both matter.
- Authentication and authorization are application responsibilities. tRPC does not automatically make public procedures secure.
- Scalability depends on storage, deployment, workload, and operational controls; the process-local store is this application's main horizontal-scaling limitation.
- Trade-off: shared TypeScript types are convenient for a controlled full-stack application; a public multi-language API may benefit from a different contract.

## Suggested short PDF outline

1. Candidate details and the verified public repository URL.
2. Rendering strategies: concise comparison and practical examples.
3. Backend approaches and tRPC: benefits and limitations.
4. Implementation: one paragraph about SSR, mutations and in-memory storage.
5. Tested behavior and known limitations, matching the delivery audit.

Write the answers first. Do not generate the final PDF until the repository is published, the candidate has reviewed the explanations, and final document creation is explicitly requested.

## Practice changes to try independently

1. Change the empty-state copy and explain why no backend test needs to change.
2. Add a visible description character counter without changing the API.
3. Add a test that two tasks with identical titles remain independent.
4. Explain how you would introduce durable storage while leaving the router contract unchanged; do not implement it yet.

Bring your attempted solution or explanation for review before asking for a completed answer.
