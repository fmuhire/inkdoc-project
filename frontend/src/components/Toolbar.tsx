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

  return (
    <section className="border-y border-rule py-4" aria-label="Editing tools">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (matches) onTransform(replaceAll(text, find, replacement, caseSensitive), `Replaced ${matches} match${matches === 1 ? "" : "es"}`);
        }}
      >
        <div>
          <label htmlFor="find" className="label">
            Find
          </label>
          <div className="relative">
            <input id="find" className="input pr-20" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Word or phrase" />
            <span className="meta absolute top-1/2 right-3 -translate-y-1/2" aria-live="polite">
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
            className={`btn h-[38px] border px-3 font-mono text-xs ${caseSensitive ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink"}`}
            onClick={() => setCaseSensitive((c) => !c)}
            aria-pressed={caseSensitive}
            aria-label="Match case"
            title="Match case"
          >
            Aa
          </button>
          <button type="submit" className="btn-secondary h-[38px] flex-1 whitespace-nowrap" disabled={!matches}>
            Replace all
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
        <span className="label mr-2 mb-0">Clean up</span>
        {CLEANUPS.map(({ label, run }) => (
          <button key={label} type="button" className="btn-ghost py-1.5 text-[13px]" onClick={() => onTransform(run(text), label)}>
            {label}
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-rule sm:block" aria-hidden />
        <button type="button" className="btn-ghost py-1.5 text-[13px]" onClick={onUndo ?? undefined} disabled={!onUndo}>
          Undo
        </button>
        <button type="button" className="btn-ghost ml-auto py-1.5 text-[13px]" onClick={copy}>
          {copied ? "Copied" : "Copy text"}
        </button>
      </div>
    </section>
  );
}
