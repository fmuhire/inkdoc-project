import { useState } from "react";
import { useToast } from "../hooks/useToast";
import { describeError, EXPORT_FORMATS, exportDocument, type ExportFormat } from "../lib/api";

interface Props {
  title: string;
  text: string;
  onExported: (format: ExportFormat) => void;
}

const FORMATS: Record<ExportFormat, { label: string; note: string }> = {
  docx: { label: "Word", note: "Edit in Word or Google Docs" },
  pdf: { label: "PDF", note: "Fixed layout, ready to print" },
  txt: { label: "Text", note: "Plain text, nothing else" },
  md: { label: "Markdown", note: "For notes apps and wikis" },
  html: { label: "HTML", note: "A standalone web page" },
};
const FONT_SIZES = [10, 11, 12, 14, 16, 18];

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportPanel({ title, text, onExported }: Props) {
  const notify = useToast();
  const [format, setFormat] = useState<ExportFormat>("docx");
  const [fontSize, setFontSize] = useState(12);
  const [includeDate, setIncludeDate] = useState(true);
  const [pageBreaks, setPageBreaks] = useState(true);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { blob, filename } = await exportDocument({
        title: title.trim() || "Untitled document",
        text,
        format,
        options: { font_size: fontSize, include_date: includeDate, page_breaks: pageBreaks },
      });
      saveBlob(blob, filename);
      onExported(format);
      notify({ tone: "success", title: `Downloaded ${filename}` });
    } catch (error) {
      notify({ tone: "error", ...describeError(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="export-heading">
      <h2 id="export-heading" className="font-serif text-xl">
        Export
      </h2>
      <fieldset>
        <legend className="label">Format</legend>
        <div className="divide-y divide-rule border-y border-rule">
          {EXPORT_FORMATS.map((value) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
              <input type="radio" name="format" value={value} checked={format === value} onChange={() => setFormat(value)} className="sr-only" />
              <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${format === value ? "border-ink" : "border-ink-3"}`} aria-hidden>
                {format === value && <span className="size-2 rounded-full bg-ink" />}
              </span>
              <span className="flex-1">
                <span className="text-sm font-medium">{FORMATS[value].label}</span>
                <span className="block text-xs text-ink-3">{FORMATS[value].note}</span>
              </span>
              <span className="meta">.{value}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="font-size" className="label">
          Font size
        </label>
        <select id="font-size" className="input" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} pt
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2.5 text-sm">
        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="size-4 accent-ink" checked={includeDate} onChange={(e) => setIncludeDate(e.target.checked)} />
          Print today's date under the title
        </label>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="size-4 accent-ink" checked={pageBreaks} onChange={(e) => setPageBreaks(e.target.checked)} />
          Start each page on a new sheet
        </label>
      </div>
      <button type="button" className="btn-primary w-full py-2.5" onClick={download} disabled={busy || !text.trim()}>
        {busy ? "Preparing file…" : `Download ${FORMATS[format].label}`}
      </button>
    </section>
  );
}
