import { TRPCError } from "@trpc/server";
import {
  taskFieldsSchema,
  taskIdSchema,
  updateTaskSchema,
} from "../../lib/task-schema";
import { t } from "../trpc";

export const tasksRouter = t.router({
  create: t.procedure
    .input(taskFieldsSchema)
    .mutation(({ ctx, input }) => ctx.store.create(input)),
  list: t.procedure.query(({ ctx }) => ctx.store.list()),
  update: t.procedure.input(updateTaskSchema).mutation(({ ctx, input }) => {
    const task = ctx.store.update(input.id, input);
    if (!task)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Task not found. It may have been deleted.",
      });
    return task;
  }),
  delete: t.procedure.input(taskIdSchema).mutation(({ ctx, input }) => {
    if (!ctx.store.delete(input.id)) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Task not found. It may have been deleted.",
      });
    }
    return { id: input.id, deleted: true as const };
  }),
});
