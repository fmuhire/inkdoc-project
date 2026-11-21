import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "../hooks/useToast";
import { describeError, EXPORT_FORMATS, exportDocument, type ExportFormat } from "../lib/api";

interface Props {
  title: string;
  text: string;
  onExported: (format: ExportFormat) => void;
}

const FORMAT_LABELS: Record<ExportFormat, string> = { docx: "Word", pdf: "PDF", txt: "Text", md: "Markdown", html: "HTML" };
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
    <section className="card space-y-5 p-5" aria-labelledby="export-heading">
      <h2 id="export-heading" className="text-base font-semibold">
        Export
      </h2>
      <fieldset>
        <legend className="label">Format</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
          {EXPORT_FORMATS.map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
                format === value
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                  : "border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <input type="radio" name="format" value={value} checked={format === value} onChange={() => setFormat(value)} className="sr-only" />
              {FORMAT_LABELS[value]}
              <span className="block text-[10px] uppercase text-slate-500 dark:text-slate-400">.{value}</span>
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
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-brand-600" checked={includeDate} onChange={(e) => setIncludeDate(e.target.checked)} />
          Include today's date
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-brand-600" checked={pageBreaks} onChange={(e) => setPageBreaks(e.target.checked)} />
          Start each page on a new page
        </label>
      </div>
      <button type="button" className="btn-primary w-full" onClick={download} disabled={busy || !text.trim()}>
        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
        {busy ? "Preparing…" : `Download ${FORMAT_LABELS[format]}`}
      </button>
    </section>
  );
}
