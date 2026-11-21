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
          <mark key={i} className="bg-accent/20 text-inherit decoration-accent underline decoration-2 underline-offset-2">
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
    <div className="border-l border-rule pl-4 first:border-l-0 first:pl-0">
      <dt className="label mb-1">{label}</dt>
      <dd className="font-serif text-3xl tabular-nums">{value.toLocaleString()}</dd>
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

  const created = new Date(doc.createdAt);

  return (
    <li className="grid gap-x-8 gap-y-3 py-6 sm:grid-cols-[7.5rem_1fr_auto]">
      <time dateTime={doc.createdAt} className="meta leading-tight uppercase">
        {created.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        <span className="block">{created.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
      </time>
      <div className="min-w-0">
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
              className="input font-serif text-lg"
              value={draft}
              maxLength={120}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
            />
            <button type="submit" className="btn-primary">
              Save
            </button>
            <button type="button" className="btn-ghost" onClick={() => setRenaming(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <h2 className="font-serif text-xl leading-snug">
            <Link to={`/documents/${doc.id}`} className="hover:text-accent">
              <Highlighted text={displayTitle(doc)} query={query} />
            </Link>
          </h2>
        )}
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">
          <Highlighted text={snippet(doc.text, query) || "No text"} query={query} />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="meta mr-1">
            {doc.pages} page{doc.pages === 1 ? "" : "s"} · {doc.words.toLocaleString()} words
          </span>
          {formats.map((format) => (
            <span key={format} className="tag">
              {format}
            </span>
          ))}
        </div>
      </div>
      <div className="-ml-2.5 flex items-start gap-1 text-[13px] sm:ml-0">
        <Link to={`/documents/${doc.id}`} className="btn-ghost py-1.5">
          Open
        </Link>
        <button
          type="button"
          className="btn-ghost py-1.5"
          onClick={() => {
            setDraft(doc.title);
            setRenaming(true);
          }}
          aria-label={`Rename ${displayTitle(doc)}`}
        >
          Rename
        </button>
        <button type="button" className="btn-ghost py-1.5 hover:text-accent" onClick={onDelete} aria-label={`Delete ${displayTitle(doc)}`}>
          Delete
        </button>
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
      notify({ tone: "success", title: "All documents cleared" });
    }
    setConfirm(null);
  };

  if (!docs.length) {
    return (
      <EmptyState kicker="Documents" title="No documents yet" description="Documents you convert are saved here, in this browser, so you can edit and export them later.">
        <Link to="/convert" className="btn-primary">
          Convert your first page
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="meta uppercase">Saved in this browser</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Documents</h1>
        </div>
        <button type="button" className="btn-ghost text-[13px] hover:text-accent" onClick={() => setConfirm({ kind: "clear" })}>
          Clear all
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-y-5 border-y border-ink py-5 sm:grid-cols-4">
        <Stat label="Documents" value={docs.length} />
        <Stat label="Pages" value={docs.reduce((sum, d) => sum + d.pages, 0)} />
        <Stat label="Words" value={docs.reduce((sum, d) => sum + d.words, 0)} />
        <Stat label="Exports" value={docs.reduce((sum, d) => sum + d.exports.length, 0)} />
      </dl>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]" aria-label="Search and filters">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="search" className="label">
            Search
          </label>
          <input id="search" type="search" className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title or text" />
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

      <div>
        <p className="meta border-b border-rule pb-3" aria-live="polite">
          Showing {visible.length} of {docs.length} document{docs.length === 1 ? "" : "s"}
        </p>
        {visible.length ? (
          <ul className="divide-y divide-rule border-b border-rule">
            {visible.map((doc) => (
              <HistoryRow key={doc.id} doc={doc} query={term} onDelete={() => setConfirm({ kind: "delete", doc })} />
            ))}
          </ul>
        ) : (
          <div className="mt-8">
            <EmptyState kicker="No results" title="No matching documents" description="Try a different search term or widen the filters.">
              {filtered && (
                <button type="button" className="btn-secondary" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </EmptyState>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "clear" ? "Clear all documents?" : "Delete this document?"}
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
