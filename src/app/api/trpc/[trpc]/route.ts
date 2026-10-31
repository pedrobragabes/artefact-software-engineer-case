import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers";
import { taskStore } from "@/server/store/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({ store: taskStore }),
  });
}

export { handler as GET, handler as POST };
