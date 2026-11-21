import { Check, FileText, FolderOpen, Pencil, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { useHistory } from "../hooks/useHistory";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { EXPORT_FORMATS, type ExportFormat } from "../lib/api";
import { clearDocs, deleteDoc, updateDoc, type HistoryDoc } from "../lib/storage";
import { highlight, snippet } from "../lib/text";

type SortKey = "newest" | "oldest" | "title" | "most-words" | "fewest-words";

const SORTS: Record<SortKey, { label: string; compare: (a: HistoryDoc, b: HistoryDoc) => number }> = {
  newest: { label: "Newest first", compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  oldest: { label: "Oldest first", compare: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  title: { label: "Title A–Z", compare: (a, b) => displayTitle(a).localeCompare(displayTitle(b)) },
  "most-words": { label: "Most words", compare: (a, b) => b.words - a.words },
  "fewest-words": { label: "Fewest words", compare: (a, b) => a.words - b.words },
};

type Confirm = { kind: "delete"; doc: HistoryDoc } | { kind: "clear" } | null;

const displayTitle = (doc: HistoryDoc) => doc.title.trim() || "Untitled document";
const localDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA");

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((segment, i) =>
        segment.match ? (
          <mark key={i} className="rounded bg-amber-200 px-0.5 text-inherit dark:bg-amber-500/40">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-3">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value.toLocaleString()}</dd>
    </div>
  );
}

function HistoryRow({ doc, query, onDelete }: { doc: HistoryDoc; query: string; onDelete: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(doc.title);
  const formats = [...new Set(doc.exports.map((e) => e.format))];

  const save = () => {
    updateDoc(doc.id, { title: draft.trim() || displayTitle(doc), updatedAt: new Date().toISOString() });
    setRenaming(false);
  };

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <label htmlFor={`rename-${doc.id}`} className="sr-only">
                New title
              </label>
              <input
                id={`rename-${doc.id}`}
                className="input"
                value={draft}
                maxLength={120}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
              />
              <button type="submit" className="btn-icon btn-primary" aria-label="Save title">
                <Check className="size-4" aria-hidden />
              </button>
              <button type="button" className="btn-icon btn-ghost" onClick={() => setRenaming(false)} aria-label="Cancel rename">
                <X className="size-4" aria-hidden />
              </button>
            </form>
          ) : (
            <h2 className="truncate font-semibold">
              <Link to={`/documents/${doc.id}`} className="hover:text-brand-600 dark:hover:text-brand-200">
                <Highlighted text={displayTitle(doc)} query={query} />
              </Link>
            </h2>
          )}
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
            <Highlighted text={snippet(doc.text, query) || "No text"} query={query} />
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <time dateTime={doc.createdAt}>{new Date(doc.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
            <span>
              {doc.pages} page{doc.pages === 1 ? "" : "s"}
            </span>
            <span>{doc.words.toLocaleString()} words</span>
            {formats.map((format) => (
              <span key={format} className="badge bg-slate-100 uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {format}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Link to={`/documents/${doc.id}`} className="btn-secondary px-3 py-1.5 text-xs">
            <FolderOpen className="size-4" aria-hidden /> Open
          </Link>
          <button
            type="button"
            className="btn-icon btn-ghost"
            onClick={() => {
              setDraft(doc.title);
              setRenaming(true);
            }}
            aria-label={`Rename ${displayTitle(doc)}`}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button type="button" className="btn-icon btn-ghost hover:text-red-600" onClick={onDelete} aria-label={`Delete ${displayTitle(doc)}`}>
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export function History() {
  usePageTitle("History");
  const docs = useHistory();
  const notify = useToast();
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<ExportFormat | "any">("any");
  const [sort, setSort] = useState<SortKey>("newest");
  const [confirm, setConfirm] = useState<Confirm>(null);

  const term = query.trim();
  const visible = useMemo(() => {
    const needle = term.toLowerCase();
    return docs
      .filter((doc) => !needle || doc.title.toLowerCase().includes(needle) || doc.text.toLowerCase().includes(needle))
      .filter((doc) => (!from || localDay(doc.createdAt) >= from) && (!to || localDay(doc.createdAt) <= to))
      .filter((doc) => format === "any" || doc.exports.some((e) => e.format === format))
      .sort(SORTS[sort].compare);
  }, [docs, term, from, to, format, sort]);

  const filtered = Boolean(term || from || to || format !== "any");
  const resetFilters = () => {
    setQuery("");
    setFrom("");
    setTo("");
    setFormat("any");
  };

  const onConfirm = () => {
    if (confirm?.kind === "delete") {
      deleteDoc(confirm.doc.id);
      notify({ tone: "success", title: `Deleted "${displayTitle(confirm.doc)}"` });
    } else if (confirm?.kind === "clear") {
      clearDocs();
      notify({ tone: "success", title: "History cleared" });
    }
    setConfirm(null);
  };

  if (!docs.length) {
    return (
      <EmptyState icon={FileText} title="No documents yet" description="Documents you convert are saved here in your browser so you can edit and export them later.">
        <Link to="/convert" className="btn-primary">
          Convert your first page
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">History</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Saved in this browser only.</p>
        </div>
        <button type="button" className="btn-ghost text-red-600 dark:text-red-400" onClick={() => setConfirm({ kind: "clear" })}>
          <Trash2 className="size-4" aria-hidden /> Clear all
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Documents" value={docs.length} />
        <Stat label="Pages" value={docs.reduce((sum, d) => sum + d.pages, 0)} />
        <Stat label="Words" value={docs.reduce((sum, d) => sum + d.words, 0)} />
        <Stat label="Exports" value={docs.reduce((sum, d) => sum + d.exports.length, 0)} />
      </dl>

      <section className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]" aria-label="Search and filters">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="search" className="label">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input id="search" type="search" className="input pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title or text" />
          </div>
        </div>
        <div>
          <label htmlFor="from" className="label">
            From
          </label>
          <input id="from" type="date" className="input" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label htmlFor="to" className="label">
            To
          </label>
          <input id="to" type="date" className="input" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label htmlFor="format" className="label">
            Exported as
          </label>
          <select id="format" className="input" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat | "any")}>
            <option value="any">Any format</option>
            {EXPORT_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">
            Sort by
          </label>
          <select id="sort" className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
        Showing {visible.length} of {docs.length} document{docs.length === 1 ? "" : "s"}
      </p>

      {visible.length ? (
        <ul className="space-y-3">
          {visible.map((doc) => (
            <HistoryRow key={doc.id} doc={doc} query={term} onDelete={() => setConfirm({ kind: "delete", doc })} />
          ))}
        </ul>
      ) : (
        <EmptyState icon={Search} title="No matching documents" description="Try a different search term or widen the filters.">
          {filtered && (
            <button type="button" className="btn-secondary" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </EmptyState>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "clear" ? "Clear all history?" : "Delete this document?"}
        description={
          confirm?.kind === "clear"
            ? `All ${docs.length} documents will be permanently removed from this browser.`
            : `"${confirm?.kind === "delete" ? displayTitle(confirm.doc) : ""}" will be permanently removed.`
        }
        confirmLabel={confirm?.kind === "clear" ? "Clear all" : "Delete"}
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
