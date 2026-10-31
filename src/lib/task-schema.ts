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
