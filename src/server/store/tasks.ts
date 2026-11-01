import { randomUUID } from "node:crypto";
import type {
  Task,
  TaskFields,
  ListTasksInput,
  TaskCursor,
  TaskPage,
} from "../../lib/task-schema";

function compareTasks(a: TaskCursor, b: TaskCursor) {
  return b.dataCriacao.localeCompare(a.dataCriacao) || a.id.localeCompare(b.id);
}

export function createTaskStore() {
  const tasks = new Map<string, Task>();

  return {
    create(fields: TaskFields): Task {
      const task = {
        ...fields,
        id: randomUUID(),
        dataCriacao: new Date().toISOString(),
      };
      tasks.set(task.id, task);
      return { ...task };
    },
    get(id: string): Task | undefined {
      const task = tasks.get(id);
      return task ? { ...task } : undefined;
    },
    list({ limit = 10, cursor }: ListTasksInput = { limit: 10 }): TaskPage {
      const remaining = Array.from(tasks.values())
        .sort(compareTasks)
        .filter((task) => !cursor || compareTasks(task, cursor) > 0);
      const items = remaining.slice(0, limit).map((task) => ({ ...task }));
      const last = items.at(-1);
      return {
        items,
        // A value cursor still works if the last task on a page is deleted.
        nextCursor:
          remaining.length > limit && last
            ? { id: last.id, dataCriacao: last.dataCriacao }
            : null,
      };
    },
    update(id: string, fields: TaskFields): Task | undefined {
      const previous = tasks.get(id);
      if (!previous) return undefined;
      const task = {
        ...previous,
        titulo: fields.titulo,
        descricao: fields.descricao,
      };
      tasks.set(id, task);
      return { ...task };
    },
    delete(id: string): boolean {
      return tasks.delete(id);
    },
  };
}

export type TaskStore = ReturnType<typeof createTaskStore>;

// Next.js can bundle route handlers and pages separately. Share one store per
// Node.js process, including during module reloads; this is not persistence.
const processGlobal = globalThis as typeof globalThis & {
  taskManagerStore?: TaskStore;
};
export const taskStore = (processGlobal.taskManagerStore ??= createTaskStore());
