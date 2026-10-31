import Link from "next/link";
import { createCaller } from "@/server/routers";
import { taskStore } from "@/server/store/tasks";
import { TaskList } from "@/components/task-list";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const tasks = await createCaller({ store: taskStore }).tasks.list();
  const { success } = await searchParams;
  const message =
    success === "created"
      ? "Task created successfully."
      : success === "updated"
        ? "Task updated successfully."
        : "";
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your tasks</h1>
          <p className="intro">Keep track of what needs to get done.</p>
        </div>
        <Link className="button primary" href="/tasks/new">
          New Task <span aria-hidden="true">+</span>
        </Link>
      </div>
      <TaskList tasks={tasks} initialMessage={message} />
    </>
  );
}
