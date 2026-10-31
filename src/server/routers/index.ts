import { t } from "../trpc";
import { tasksRouter } from "./tasks";

export const appRouter = t.router({ tasks: tasksRouter });
export type AppRouter = typeof appRouter;
export const createCaller = t.createCallerFactory(appRouter);
