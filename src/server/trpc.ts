import { initTRPC } from "@trpc/server";
import type { TaskStore } from "./store/tasks";

export const t = initTRPC.context<{ store: TaskStore }>().create({
  errorFormatter({ shape }) {
    return {
      ...shape,
      message:
        shape.data.code === "INTERNAL_SERVER_ERROR"
          ? "Something went wrong. Please try again."
          : shape.message,
      data: { ...shape.data, stack: undefined },
    };
  },
});
