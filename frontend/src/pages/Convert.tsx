import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropzone } from "../components/Dropzone";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { ApiError, describeError, FATAL_CODES, recognize, toApiError } from "../lib/api";
import { addDoc, createId, rememberImages } from "../lib/storage";
import { countWords, joinPages } from "../lib/text";

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff", "image/gif"]);

type Status = "queued" | "processing" | "done" | "error";

interface Item {
  id: string;
  file: File;
  url: string;
  status: Status;
  error?: string;
}

function rejectionReason(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) return `${file.name}: use JPG, PNG, WEBP, BMP, TIFF or GIF.`;
  if (file.size > MAX_BYTES) return `${file.name}: larger than 10 MB.`;
  return null;
}

const STATUS_LABEL: Record<Status, { text: string; className: string } | null> = {
  queued: null,
  processing: { text: "Reading…", className: "bg-ink text-paper animate-shimmer" },
  done: { text: "Done", className: "bg-ok text-sheet" },
  error: { text: "Failed", className: "bg-accent text-on-accent" },
};

function StatusLabel({ status }: { status: Status }) {
  const label = STATUS_LABEL[status];
  if (!label) return null;
  return <span className={`px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase ${label.className}`}>{label.text}</span>;
}

export function Convert() {
  usePageTitle("Convert");
  const notify = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const itemsRef = useRef(items);
  const keptUrls = useRef(new Set<string>());
  itemsRef.current = items;

  // Release photo previews on leave, except the ones handed to the editor.
  useEffect(
    () => () => itemsRef.current.forEach((item) => keptUrls.current.has(item.url) || URL.revokeObjectURL(item.url)),
    [],
  );

  const addFiles = (files: File[]) => {
    const problems: string[] = [];
    const accepted = files.filter((file) => {
      const reason = rejectionReason(file);
      if (reason) problems.push(reason);
      return !reason;
    });
    const room = MAX_FILES - items.length;
    if (accepted.length > room) problems.push(`Only ${MAX_FILES} pages per document; ${accepted.length - room} skipped.`);
    const added = accepted.slice(0, Math.max(room, 0)).map((file) => ({
      id: createId(),
      file,
      url: URL.createObjectURL(file),
      status: "queued" as Status,
    }));
    setItems((current) => [...current, ...added]);
    if (problems.length) {
      notify({ tone: "error", title: `${problems.length === 1 ? "A file was" : "Some files were"} not added`, description: problems.join(" ") });
    }
  };

  const move = (index: number, offset: number) =>
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + offset, 0, item!);
      return next;
    });

  const remove = (id: string) =>
    setItems((current) => {
      const item = current.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((i) => i.id !== id);
    });

  const update = (id: string, patch: Partial<Item>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const extract = async () => {
    setBusy(true);
    const queue = items.map((item) => ({ ...item, status: "queued" as Status, error: undefined }));
    setItems(queue);
    const succeeded: { item: Item; text: string; cached: boolean }[] = [];
    let server = "";
    let fatal: ApiError | null = null;

    for (const item of queue) {
      if (fatal) {
        update(item.id, { status: "error", error: "Skipped" });
        continue;
      }
      update(item.id, { status: "processing" });
      try {
        const result = await recognize([item.file]);
        const page = result.pages[0]!;
        server = result.server;
        if (page.error) throw toApiError(page.error.code, page.error.message);
        succeeded.push({ item, text: page.text, cached: page.cached });
        update(item.id, { status: "done" });
      } catch (error) {
        const apiError = error instanceof ApiError ? error : toApiError("unknown");
        if (FATAL_CODES.has(apiError.code)) fatal = apiError;
        update(item.id, { status: "error", error: apiError.message });
        if (fatal || queue.length === 1) notify({ tone: "error", ...describeError(apiError) });
      }
    }
    setBusy(false);

    if (!succeeded.length) return;
    const failed = queue.length - succeeded.length;
    const text = joinPages(succeeded.map((s) => s.text));
    const now = new Date().toISOString();
    const id = createId();
    const saved = addDoc({
      id,
      title: `Notes ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`,
      createdAt: now,
      updatedAt: now,
      pages: succeeded.length,
      words: countWords(text),
      text,
      filenames: succeeded.map((s) => s.item.file.name),
      server,
      cachedPages: succeeded.filter((s) => s.cached).length,
      exports: [],
    });
    const urls = succeeded.map((s) => s.item.url);
    urls.forEach((url) => keptUrls.current.add(url));
    rememberImages(id, urls);
    if (!saved) notify({ tone: "error", title: "Couldn't save to history.", description: "Browser storage is full. Delete old documents in History." });
    if (failed) {
      notify({ tone: "info", title: `${failed} of ${queue.length} pages couldn't be read`, description: "They were left out. Retake those photos and convert them separately." });
    }
    navigate(`/documents/${id}`);
  };

  const done = items.filter((i) => i.status === "done" || i.status === "error").length;
  const current = items.findIndex((i) => i.status === "processing");

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <p className="meta uppercase">Step 1 of 2 — add your pages</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Convert handwriting</h1>
        <p className="mt-3 max-w-xl text-ink-2">Add photos in page order. You can still reorder or remove them before reading.</p>
      </header>

      <Dropzone onFiles={addFiles} disabled={busy || items.length >= MAX_FILES} hint={`JPG, PNG or WEBP — up to ${MAX_FILES} pages — 10 MB each`} />

      {items.length > 0 && (
        <section aria-labelledby="pages-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
            <h2 id="pages-heading" className="font-serif text-2xl">
              {items.length} page{items.length === 1 ? "" : "s"} <span className="text-ink-3">ready</span>
            </h2>
            <button type="button" className="btn-primary" onClick={extract} disabled={busy}>
              {busy ? "Reading…" : "Extract text"}
            </button>
          </div>

          {busy && (
            <div className="space-y-2">
              <p className="meta" aria-live="polite">
                {current >= 0 ? `Reading page ${current + 1} of ${items.length}` : "Finishing up"}
              </p>
              <div
                role="progressbar"
                aria-label="Extraction progress"
                aria-valuemin={0}
                aria-valuemax={items.length}
                aria-valuenow={done}
                className="h-0.5 bg-rule"
              >
                <div className="h-full bg-ink transition-all duration-500" style={{ width: `${(done / items.length) * 100}%` }} />
              </div>
            </div>
          )}

          <ol className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item, index) => (
              <li key={item.id}>
                <div className="sheet relative aspect-[3/4] p-1.5">
                  <img src={item.url} alt={`Page ${index + 1}: ${item.file.name}`} className="size-full object-cover" />
                  <span className="absolute top-3 right-3">
                    <StatusLabel status={item.status} />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-lg italic">{index + 1}</span>
                  <span className="meta min-w-0 flex-1 truncate" title={item.file.name}>
                    {item.file.name}
                  </span>
                </div>
                {item.error && <p className="mt-1 text-xs text-accent">{item.error}</p>}
                <div className="mt-1 -ml-2.5 flex items-center text-[13px]">
                  <button type="button" className="btn-ghost px-2 py-1" onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={`Move page ${index + 1} earlier`}>
                    ←
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    onClick={() => move(index, 1)}
                    disabled={busy || index === items.length - 1}
                    aria-label={`Move page ${index + 1} later`}
                  >
                    →
                  </button>
                  <button type="button" className="btn-ghost ml-auto px-2 py-1 hover:text-accent" onClick={() => remove(item.id)} disabled={busy} aria-label={`Remove page ${index + 1}`}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
