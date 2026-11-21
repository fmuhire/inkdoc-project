import { countWords } from "../lib/text";

interface Props {
  number: number;
  total: number;
  filename?: string;
  imageUrl?: string;
  text: string;
  onChange: (text: string) => void;
}

export function PageCard({ number, total, filename, imageUrl, text, onChange }: Props) {
  const id = `page-${number}`;
  return (
    <article className={imageUrl ? "grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : ""} aria-labelledby={`${id}-label`}>
      {imageUrl && (
        <figure className="self-start">
          <a href={imageUrl} target="_blank" rel="noreferrer" className="block border border-rule bg-sheet p-2">
            <img src={imageUrl} alt={`Original photo of page ${number}`} className="mx-auto max-h-[28rem] object-contain" />
          </a>
          <figcaption className="meta mt-2 truncate">Original — {filename}</figcaption>
        </figure>
      )}
      <div className="sheet">
        <header className="flex items-baseline justify-between gap-3 border-b border-rule px-6 py-3">
          <h3 id={`${id}-label`} className="meta uppercase">
            Page {number} of {total}
            {!imageUrl && filename && <span className="ml-2 normal-case">— {filename}</span>}
          </h3>
          <span className="meta">{countWords(text)} words</span>
        </header>
        <label htmlFor={id} className="sr-only">
          Text of page {number}
        </label>
        <textarea
          id={id}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          rows={12}
          spellCheck
          placeholder="No text was found on this page. Type it here."
          className="block min-h-72 w-full resize-y bg-transparent px-6 py-5 font-serif text-[17px] leading-[1.75] text-ink placeholder:text-ink-3 focus:outline-none"
        />
      </div>
    </article>
  );
}
