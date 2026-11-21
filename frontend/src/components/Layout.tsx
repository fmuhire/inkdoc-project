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

  if (status.state === "loading") return <span className="skeleton inline-block h-3 w-44 align-middle" aria-label="Checking API status" />;
  const online = status.state === "online";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-1.5 rounded-full ${online ? "bg-ok" : "bg-accent"}`} aria-hidden />
      {online ? `API online — ${status.health.server} — v${status.health.version}` : "API offline"}
    </span>
  );
}

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Outlet />
      </main>
      <footer className="border-t border-rule">
        <div className="meta mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            InkDoc — handwriting recognition by{" "}
            <a className="underline decoration-rule underline-offset-4 hover:text-ink" href="https://rapidapi.com/serendi/api/pen-to-print-handwriting-ocr" target="_blank" rel="noreferrer">
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
