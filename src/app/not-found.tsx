import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Page not found</h1>
      <p>This page or task does not exist. It may have been deleted.</p>
      <Link className="button primary" href="/">
        Back to tasks
      </Link>
    </div>
  );
}
