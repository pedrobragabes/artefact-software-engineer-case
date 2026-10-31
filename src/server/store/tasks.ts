import { randomUUID } from "node:crypto";
import type { Task, TaskFields } from "../../lib/task-schema";

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
    list(): Task[] {
      return Array.from(tasks.values(), (task) => ({ ...task })).sort(
        (a, b) =>
          b.dataCriacao.localeCompare(a.dataCriacao) ||
          a.id.localeCompare(b.id),
      );
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
