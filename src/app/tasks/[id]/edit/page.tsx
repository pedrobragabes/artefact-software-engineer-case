import { TRPCError } from "@trpc/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { createCaller } from "@/server/routers";
import { taskStore } from "@/server/store/tasks";
import { taskIdSchema } from "@/lib/task-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const input = taskIdSchema.safeParse(await params);
  if (!input.success) notFound();
  const task = await createCaller({ store: taskStore })
    .tasks.get(input.data)
    .catch((error: unknown) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
      throw error;
    });
  return (
    <div className="form-page">
      <Link className="back-link" href="/">
        ← Back to tasks
      </Link>
      <div className="form-heading">
        <h1>Edit task</h1>
        <p className="intro">Change the title or description.</p>
      </div>
      <TaskForm task={task} />
    </div>
  );
}
