"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { taskFieldsSchema, type Task } from "@/lib/task-schema";
import { trpc } from "@/lib/trpc-client";
import { errorMessage } from "@/lib/error-message";

export function TaskForm({ task }: { task?: Task }) {
  const router = useRouter();
  const [titulo, setTitle] = useState(task?.titulo ?? "");
  const [descricao, setDescription] = useState(task?.descricao ?? "");
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigating, startTransition] = useTransition();
  const busy = submitting || navigating;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setServerError("");
    const result = taskFieldsSchema.safeParse({ titulo, descricao });
    if (!result.success) {
      setFieldError(result.error.issues[0].message);
      return;
    }
    setFieldError("");
    setSubmitting(true);
    try {
      if (task) await trpc.tasks.update.mutate({ id: task.id, ...result.data });
      else await trpc.tasks.create.mutate(result.data);
      startTransition(() => {
        router.push(`/?success=${task ? "updated" : "created"}`);
        router.refresh();
      });
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit} aria-busy={busy} noValidate>
      <div role="alert" className={serverError ? "notice error" : "sr-only"}>
        {serverError}
      </div>
      <fieldset disabled={busy}>
        <div className="field">
          <label htmlFor="title">
            Title <span className="required">(required)</span>
          </label>
          <input
            id="title"
            name="titulo"
            autoComplete="off"
            maxLength={200}
            required
            value={titulo}
            onChange={(event) => {
              setTitle(event.target.value);
              setFieldError("");
            }}
            aria-invalid={!!fieldError}
            aria-describedby="title-help title-error"
          />
          <p className="field-help" id="title-help">
            A short, clear name for your task. Up to 200 characters.
          </p>
          <p
            id="title-error"
            role="alert"
            className={fieldError ? "field-error" : "sr-only"}
          >
            {fieldError}
          </p>
        </div>
        <div className="field">
          <label htmlFor="description">
            Description <span className="required">(optional)</span>
          </label>
          <textarea
            id="description"
            name="descricao"
            rows={5}
            maxLength={5000}
            value={descricao}
            onChange={(event) => setDescription(event.target.value)}
            aria-describedby="description-help"
          />
          <p id="description-help" className="field-help">
            Add any details you want to remember. Up to 5,000 characters.
          </p>
        </div>
        <div className="form-actions">
          <button type="submit" className="button primary">
            {busy ? "Saving…" : task ? "Save Changes" : "Create Task"}
          </button>
          {!busy && (
            <Link className="button secondary" href="/">
              Cancel
            </Link>
          )}
        </div>
      </fieldset>
      <p role="status" className={busy ? "field-help" : "sr-only"}>
        {busy ? "Saving your task…" : ""}
      </p>
    </form>
  );
}
