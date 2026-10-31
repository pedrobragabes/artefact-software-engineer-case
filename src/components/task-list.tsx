"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Task } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc-client";
import { errorMessage } from "@/lib/error-message";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function TaskList({
  tasks,
  initialMessage,
}: {
  tasks: Task[];
  initialMessage: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [refreshing, startTransition] = useTransition();
  const busy = deleting !== null || refreshing;

  async function deleteTask(id: string) {
    setDeleting(id);
    setFeedback(null);
    try {
      await trpc.tasks.delete.mutate({ id });
      setFeedback({ message: "Task deleted successfully.", error: false });
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({ message: errorMessage(error), error: true });
    } finally {
      setDeleting(null);
    }
  }

  const message = feedback?.message ?? initialMessage;
  return (
    <section aria-label="Task list" aria-busy={busy}>
      <div
        role="status"
        className={message && !feedback?.error ? "notice success" : "sr-only"}
      >
        {!feedback?.error ? message : ""}
      </div>
      <div
        role="alert"
        className={feedback?.error ? "notice error" : "sr-only"}
      >
        {feedback?.error ? message : ""}
      </div>
      {tasks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">
            ✓
          </span>
          <h2>A clear starting point</h2>
          <p>No tasks yet. Add your first task to get started.</p>
          <Link className="text-link" href="/tasks/new">
            Create your first task <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li className="task-card" key={task.id}>
              <div className="task-content">
                <h2>{task.titulo}</h2>
                {task.descricao && (
                  <p className="description">{task.descricao}</p>
                )}
                <p className="task-date">
                  Created{" "}
                  <time dateTime={task.dataCriacao}>
                    {dateFormatter.format(new Date(task.dataCriacao))} UTC
                  </time>
                </p>
              </div>
              <div className="task-actions">
                <Link
                  className="button secondary"
                  href={`/tasks/${task.id}/edit`}
                  aria-label={`Edit ${task.titulo}`}
                >
                  Edit
                </Link>
                <button
                  className="button danger"
                  disabled={busy}
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.titulo}`}
                >
                  {deleting === task.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
