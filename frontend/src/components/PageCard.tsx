import { countWords } from "../lib/text";

interface Props {
  number: number;
  filename?: string;
  imageUrl?: string;
  text: string;
  onChange: (text: string) => void;
}

export function PageCard({ number, filename, imageUrl, text, onChange }: Props) {
  const id = `page-${number}`;
  return (
    <article className="card overflow-hidden" aria-labelledby={`${id}-label`}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <h3 id={`${id}-label`} className="truncate text-sm font-semibold">
          Page {number}
          {filename && <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">{filename}</span>}
        </h3>
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{countWords(text)} words</span>
      </header>
      <div className={imageUrl ? "grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : ""}>
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer" className="block bg-slate-100 p-3 dark:bg-slate-800/50">
            <img src={imageUrl} alt={`Original photo of page ${number}`} className="mx-auto max-h-96 rounded object-contain" />
          </a>
        )}
        <label htmlFor={id} className="sr-only">
          Text of page {number}
        </label>
        <textarea
          id={id}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          rows={12}
          spellCheck
          placeholder="No text was detected on this page. Type it here."
          className="block min-h-64 w-full resize-y border-0 bg-transparent p-4 font-serif text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/40"
        />
      </div>
    </article>
  );
}
