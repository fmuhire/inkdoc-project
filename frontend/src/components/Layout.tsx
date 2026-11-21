import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getHealth, type Health } from "../lib/api";
import { Navbar } from "./Navbar";

type Status = { state: "loading" } | { state: "online"; health: Health } | { state: "offline" };

function ApiStatus() {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((health) => setStatus({ state: "online", health }))
      .catch(() => controller.signal.aborted || setStatus({ state: "offline" }));
    return () => controller.abort();
  }, []);

  if (status.state === "loading") return <span className="skeleton inline-block h-4 w-40" aria-label="Checking API status" />;
  const online = status.state === "online";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`} aria-hidden />
      {online ? `API online · ${status.health.server} · v${status.health.version}` : "API offline"}
    </span>
  );
}

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow dark:focus:bg-slate-900"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
          <p>
            InkDoc · OCR by{" "}
            <a className="underline hover:text-slate-900 dark:hover:text-white" href="https://rapidapi.com/serendi/api/pen-to-print-handwriting-ocr" target="_blank" rel="noreferrer">
              Pen to Print
            </a>
          </p>
          <p aria-live="polite">
            <ApiStatus />
          </p>
        </div>
      </footer>
    </div>
  );
}
