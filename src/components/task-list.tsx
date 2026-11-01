"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { TaskPage } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc-client";
import { errorMessage } from "@/lib/error-message";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function TaskList({
  initialPage,
  initialMessage,
}: {
  initialPage: TaskPage;
  initialMessage: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadButton = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  const tasks = page.items;
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [refreshing, startTransition] = useTransition();
  const busy = deleting !== null || refreshing;

  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setPage(initialPage);
    setLoadError("");
    setLoadingMore(false);
    return () => {
      request.current?.abort();
    };
  }, [initialPage]);

  const loadMore = useCallback(async () => {
    if (!page.nextCursor || request.current || busy) return;
    const controller = new AbortController();
    request.current = controller;
    setLoadingMore(true);
    setLoadError("");
    try {
      const next = await trpc.tasks.list.query(
        { cursor: page.nextCursor },
        { signal: controller.signal },
      );
      if (!controller.signal.aborted) {
        setPage((previous) => ({
          items: [...previous.items, ...next.items],
          nextCursor: next.nextCursor,
        }));
      }
    } catch {
      if (!controller.signal.aborted)
        setLoadError("Could not load more tasks. Please try again.");
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setLoadingMore(false);
      }
    }
  }, [page.nextCursor, busy]);

  useEffect(() => {
    if (
      !loadButton.current ||
      loadingMore ||
      loadError ||
      busy ||
      !page.nextCursor
    )
      return;
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    });
    observer.observe(loadButton.current);
    return () => observer.disconnect();
  }, [loadMore, loadingMore, loadError, busy, page.nextCursor]);

  useEffect(() => {
    if (!initialMessage) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("success")) return;
    url.searchParams.delete("success");
    // Keep feedback in this visit while consuming the URL parameter.
    setFeedback({ message: initialMessage, error: false });
    router.replace(url.pathname + url.search + url.hash, { scroll: false });
  }, [initialMessage, router]);

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
          <h2>No tasks yet.</h2>
          <p>Create your first task to get started.</p>
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
                  disabled={busy || loadingMore}
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
      {page.nextCursor && (
        <div className="load-more">
          {loadError && (
            <p role="alert" className="field-error">
              {loadError}
            </p>
          )}
          <button
            ref={loadButton}
            className="button secondary"
            disabled={busy || loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? "Loading…" : loadError ? "Try again" : "Load More"}
          </button>
          <p className="sr-only" aria-live="polite">
            {loadingMore
              ? "Loading more tasks…"
              : `${tasks.length} tasks loaded.`}
          </p>
        </div>
      )}
    </section>
  );
}
