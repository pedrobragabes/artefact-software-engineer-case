import { z } from "zod";

export const taskFieldsSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(200, "Title must be 200 characters or fewer."),
    descricao: z
      .string()
      .trim()
      .max(5000, "Description must be 5,000 characters or fewer.")
      .optional(),
  })
  .strict();

export const taskIdSchema = z
  .object({ id: z.uuid("Invalid task ID.") })
  .strict();
export const updateTaskSchema = taskFieldsSchema.extend({
  id: z.uuid("Invalid task ID."),
});

export type TaskFields = z.infer<typeof taskFieldsSchema>;
export type Task = TaskFields & { id: string; dataCriacao: string };

export const listTasksSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    cursor: z
      .object({
        id: z.uuid(),
        dataCriacao: z.iso.datetime(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .prefault({});

export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type TaskCursor = NonNullable<ListTasksInput["cursor"]>;
export type TaskPage = { items: Task[]; nextCursor: TaskCursor | null };
