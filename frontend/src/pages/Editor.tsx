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
      <EmptyState kicker="Missing" title="Document not found" description="It may have been deleted, or it was saved in a different browser.">
        <Link to="/history" className="btn-primary">
          Open documents
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

  const stats = [`${words.toLocaleString()} words`, `${countChars(text).toLocaleString()} characters`, `${readingMinutes(words)} min read`];

  return (
    <div className="space-y-8">
      <header>
        <Link to="/history" className="meta hover:text-ink">
          ← All documents
        </Link>
        <label htmlFor="doc-title" className="sr-only">
          Document title
        </label>
        <input
          id="doc-title"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled document"
          className="-mx-1 mt-3 w-full border-b border-transparent bg-transparent px-1 pb-1 font-serif text-4xl tracking-tight placeholder:text-ink-3 hover:border-rule focus:border-ink focus:outline-none sm:text-5xl"
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="meta">
            {stats.join(" · ")} · <span aria-live="polite">{dirty ? "Saving…" : "Saved"}</span>
          </p>
          <div className="flex gap-2 sm:ml-auto">
            {doc.server && <span className="tag">Served by {doc.server}</span>}
            {doc.cachedPages > 0 && (
              <span className="tag border-ok/40 text-ok">{doc.cachedPages === doc.filenames.length ? "Cached" : `${doc.cachedPages} cached`}</span>
            )}
          </div>
        </div>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-6">
          <Toolbar text={text} onTransform={transform} onUndo={previous === null ? null : undo} />

          <div className="flex items-center gap-5 border-b border-rule" role="group" aria-label="View mode">
            {(["pages", "combined"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                onClick={() => setView(mode)}
                className={`-mb-px border-b-2 pb-2 text-sm ${view === mode ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
              >
                {mode === "pages" ? "Per page" : "Combined"}
              </button>
            ))}
            <span className="meta ml-auto pb-2">
              {pages.length} page{pages.length === 1 ? "" : "s"}
            </span>
          </div>

          {view === "pages" ? (
            <div className="space-y-10">
              {pages.map((page, index) => (
                <PageCard
                  key={index}
                  number={index + 1}
                  total={pages.length}
                  filename={doc.filenames[index]}
                  imageUrl={pages.length === images.length ? images[index] : undefined}
                  text={page}
                  onChange={(value) => setText(joinPages(pages.map((p, i) => (i === index ? value : p))))}
                />
              ))}
            </div>
          ) : (
            <div className="sheet">
              <label htmlFor="combined" className="sr-only">
                Full document text
              </label>
              <textarea
                id="combined"
                value={toCombined(text)}
                onChange={(event) => setText(fromCombined(event.target.value))}
                rows={24}
                spellCheck
                className="block min-h-[32rem] w-full resize-y bg-transparent px-6 py-6 font-serif text-[17px] leading-[1.75] focus:outline-none sm:px-12"
              />
              <p className="meta border-t border-rule px-6 py-2.5 sm:px-12">The page-break lines separate pages. Delete one to merge two pages.</p>
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
