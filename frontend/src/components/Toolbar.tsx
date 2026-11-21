import { CaseSensitive, Check, Copy, Replace, Search, Undo2, WandSparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "../hooks/useToast";
import {
  countMatches,
  joinBrokenLines,
  lowerCase,
  replaceAll,
  sentenceCase,
  toPlainText,
  trimSpaces,
  upperCase,
} from "../lib/text";

// The async Clipboard API is HTTPS-only; plain HTTP needs the legacy copy command.
async function writeClipboard(value: string): Promise<void> {
  if (navigator.clipboard) return navigator.clipboard.writeText(value);
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Copy command failed");
}

interface Props {
  text: string;
  onTransform: (next: string, label: string) => void;
  onUndo: (() => void) | null;
}

const CLEANUPS = [
  { label: "Trim spaces", run: trimSpaces },
  { label: "Join broken lines", run: joinBrokenLines },
  { label: "Sentence case", run: sentenceCase },
  { label: "UPPERCASE", run: upperCase },
  { label: "lowercase", run: lowerCase },
];

export function Toolbar({ text, onTransform, onUndo }: Props) {
  const notify = useToast();
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [copied, setCopied] = useState(false);
  const matches = countMatches(text, find, caseSensitive);

  const copy = async () => {
    try {
      await writeClipboard(toPlainText(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify({ tone: "error", title: "Couldn't copy to the clipboard.", description: "Select the text and press Ctrl/Cmd + C instead." });
    }
  };

  const runReplace = () => {
    onTransform(replaceAll(text, find, replacement, caseSensitive), `Replaced ${matches} match${matches === 1 ? "" : "es"}`);
  };

  return (
    <section className="card space-y-4 p-4" aria-label="Editing tools">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (matches) runReplace();
        }}
      >
        <div>
          <label htmlFor="find" className="label">
            Find
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input id="find" className="input pl-9 pr-20" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search text" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" aria-live="polite">
              {find && `${matches} found`}
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="replace" className="label">
            Replace with
          </label>
          <input id="replace" className="input" value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="Replacement" />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            className={`btn-icon border ${caseSensitive ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200" : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}
            onClick={() => setCaseSensitive((c) => !c)}
            aria-pressed={caseSensitive}
            aria-label="Match case"
            title="Match case"
          >
            <CaseSensitive className="size-5" aria-hidden />
          </button>
          <button type="submit" className="btn-secondary flex-1 whitespace-nowrap" disabled={!matches}>
            <Replace className="size-4" aria-hidden />
            Replace all
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <WandSparkles className="size-4 text-slate-400" aria-hidden />
        {CLEANUPS.map(({ label, run }) => (
          <button key={label} type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => onTransform(run(text), label)}>
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs" onClick={onUndo ?? undefined} disabled={!onUndo}>
            <Undo2 className="size-4" aria-hidden />
            Undo
          </button>
          <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs" onClick={copy}>
            {copied ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
      </div>
    </section>
  );
}
