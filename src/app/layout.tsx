import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A simple space to organize your tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="shell">
            <Link className="brand" href="/">
              Task Manager
              <span className="brand-dot" aria-hidden="true">
                .
              </span>
            </Link>
          </div>
        </header>
        <main id="main" className="shell">
          {children}
        </main>
        <footer className="shell">A little structure for your day.</footer>
      </body>
    </html>
  );
}
