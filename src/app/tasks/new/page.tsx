import Link from "next/link";
import { TaskForm } from "@/components/task-form";

export default function NewTaskPage() {
  return (
    <div className="form-page">
      <Link className="back-link" href="/">
        ← Back to tasks
      </Link>
      <div className="form-heading">
        <h1>New task</h1>
        <p className="intro">Add a title and any details you need.</p>
      </div>
      <TaskForm />
    </div>
  );
}
