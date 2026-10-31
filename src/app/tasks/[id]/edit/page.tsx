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
  const tasks = await createCaller({ store: taskStore }).tasks.list();
  const task = tasks.find((item) => item.id === input.data.id);
  if (!task) notFound();
  return (
    <div className="form-page">
      <Link className="back-link" href="/">
        ← Back to tasks
      </Link>
      <div className="form-heading">
        <h1>Edit task</h1>
        <p className="intro">Update the details and keep moving.</p>
      </div>
      <TaskForm task={task} />
    </div>
  );
}
