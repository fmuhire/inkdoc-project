import { ArrowLeft, Database, FileQuestionMark, Server } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ExportPanel } from "../components/ExportPanel";
import { PageCard } from "../components/PageCard";
import { Toolbar } from "../components/Toolbar";
import { useHistory } from "../hooks/useHistory";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import type { ExportFormat } from "../lib/api";
import { getDocs, imagesFor, recordExport, updateDoc, type HistoryDoc } from "../lib/storage";
import { countChars, countWords, fromCombined, joinPages, readingMinutes, splitPages, toCombined } from "../lib/text";

const AUTOSAVE_MS = 600;

function persist(id: string, title: string, text: string): void {
  const stored = getDocs().find((doc) => doc.id === id);
  if (!stored || (stored.title === title && stored.text === text)) return;
  updateDoc(id, { title, text, words: countWords(text), pages: splitPages(text).length, updatedAt: new Date().toISOString() });
}

export function Editor() {
  const { id = "" } = useParams();
  const doc = useHistory().find((d) => d.id === id);
  if (!doc) {
    return (
      <EmptyState icon={FileQuestionMark} title="Document not found" description="It may have been deleted, or it was saved in a different browser.">
        <Link to="/history" className="btn-primary">
          Open history
        </Link>
        <Link to="/convert" className="btn-secondary">
          Convert new pages
        </Link>
      </EmptyState>
    );
  }
  return <DocumentEditor key={doc.id} doc={doc} />;
}

function DocumentEditor({ doc }: { doc: HistoryDoc }) {
  const notify = useToast();
  const [title, setTitle] = useState(doc.title);
  const [text, setText] = useState(doc.text);
  const [view, setView] = useState<"pages" | "combined">("pages");
  const [previous, setPrevious] = useState<string | null>(null);
  const latest = useRef({ title, text });
  latest.current = { title, text };
  usePageTitle(title.trim() || "Untitled document");

  useEffect(() => {
    const timer = setTimeout(() => persist(doc.id, title, text), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [doc.id, title, text]);

  useEffect(() => () => persist(doc.id, latest.current.title, latest.current.text), [doc.id]);

  const pages = splitPages(text);
  const images = imagesFor(doc.id);
  const words = countWords(text);
  const dirty = title !== doc.title || text !== doc.text;

  const transform = (next: string, label: string) => {
    if (next === text) {
      notify({ tone: "info", title: "Nothing to change", description: `${label} found nothing to update.` });
      return;
    }
    setPrevious(text);
    setText(next);
    notify({ tone: "success", title: `${label} applied`, description: "Use Undo to revert." });
  };

  const undo = () => {
    if (previous === null) return;
    setText(previous);
    setPrevious(null);
  };

  const onExported = (format: ExportFormat) => {
    persist(doc.id, title, text);
    recordExport(doc.id, format);
  };

  return (
    <div className="space-y-6">
      <Link to="/history" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> All documents
      </Link>

      <header className="space-y-3">
        <label htmlFor="doc-title" className="sr-only">
          Document title
        </label>
        <input
          id="doc-title"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled document"
          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 -mx-2 font-serif text-2xl font-semibold hover:border-slate-300 focus:border-brand-500 focus:outline-none sm:text-3xl dark:hover:border-slate-700"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>{words.toLocaleString()} words</span>
          <span aria-hidden>·</span>
          <span>{countChars(text).toLocaleString()} characters</span>
          <span aria-hidden>·</span>
          <span>{readingMinutes(words)} min read</span>
          <span aria-hidden>·</span>
          <span aria-live="polite">{dirty ? "Saving…" : "Saved"}</span>
          {doc.server && (
            <span className="badge ml-auto bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Server className="size-3" aria-hidden /> Served by {doc.server}
            </span>
          )}
          {doc.cachedPages > 0 && (
            <span className={`badge bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ${doc.server ? "" : "ml-auto"}`}>
              <Database className="size-3" aria-hidden /> {doc.cachedPages === doc.filenames.length ? "Cached" : `${doc.cachedPages} cached`}
            </span>
          )}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <Toolbar text={text} onTransform={transform} onUndo={previous === null ? null : undo} />

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              {pages.length} page{pages.length === 1 ? "" : "s"}
            </h2>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700" role="group" aria-label="View mode">
              {(["pages", "combined"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    view === mode ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {mode === "pages" ? "Per page" : "Combined"}
                </button>
              ))}
            </div>
          </div>

          {view === "pages" ? (
            pages.map((page, index) => (
              <PageCard
                key={index}
                number={index + 1}
                filename={doc.filenames[index]}
                imageUrl={pages.length === images.length ? images[index] : undefined}
                text={page}
                onChange={(value) => setText(joinPages(pages.map((p, i) => (i === index ? value : p))))}
              />
            ))
          ) : (
            <div className="card">
              <label htmlFor="combined" className="sr-only">
                Full document text
              </label>
              <textarea
                id="combined"
                value={toCombined(text)}
                onChange={(event) => setText(fromCombined(event.target.value))}
                rows={24}
                spellCheck
                className="block min-h-96 w-full resize-y rounded-xl border-0 bg-transparent p-5 font-serif text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/40"
              />
              <p className="border-t border-slate-200 px-5 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Page break lines separate pages. Delete one to merge two pages.
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <ExportPanel title={title} text={text} onExported={onExported} />
        </aside>
      </div>
    </div>
  );
}
