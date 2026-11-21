import { ArrowRight, Camera, FileDown, PenLine, ScanText, ShieldCheck, Sparkles, History as HistoryIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

const STEPS = [
  { icon: Camera, title: "Snap or upload", text: "Add up to 10 photos of handwritten pages from your phone or computer." },
  { icon: ScanText, title: "Review the text", text: "InkDoc reads the handwriting. Fix mistakes with find & replace and one-click cleanup." },
  { icon: FileDown, title: "Export anywhere", text: "Download Word, PDF, Markdown, HTML or plain text, ready to share or submit." },
];

const FEATURES = [
  { icon: Sparkles, title: "Cleanup tools", text: "Trim stray spaces, join broken lines and fix capitalisation in one click." },
  { icon: HistoryIcon, title: "Saved history", text: "Every document is kept in your browser, searchable and ready to re-export." },
  { icon: ShieldCheck, title: "Private by design", text: "Documents stay on your device. The OCR key never leaves the server." },
];

export function Home() {
  usePageTitle("");
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="badge mb-4 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">Handwriting OCR · 5 export formats</p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Handwritten notes in.
            <br />
            Clean documents out.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            InkDoc turns photos of handwritten pages into editable text, then exports them as Word, PDF, Markdown, HTML or plain text.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/convert" className="btn-primary px-5 py-2.5 text-base">
              Start converting <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link to="/history" className="btn-secondary px-5 py-2.5 text-base">
              View history
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md" aria-hidden>
          <div className="card rotate-[-3deg] bg-amber-50 p-6 dark:bg-amber-100">
            <p className="font-serif text-xl italic leading-loose text-slate-700 [background:repeating-linear-gradient(transparent,transparent_2.1rem,#cbd5e1_2.1rem,#cbd5e1_calc(2.1rem+1px))]">
              Meeting notes — Tuesday
              <br />
              Ship the export panel,
              <br />
              then test the load balancer.
            </p>
          </div>
          <div className="card absolute -bottom-10 right-0 w-3/4 rotate-2 p-4 shadow-lg sm:-right-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-200">
              <PenLine className="size-3.5" /> Extracted text
            </div>
            <p className="text-sm">Meeting notes — Tuesday. Ship the export panel, then test the load balancer.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-center text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>
                <Icon className="size-5 text-brand-600 dark:text-brand-200" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Features">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-4 p-2">
            <Icon className="mt-0.5 size-5 shrink-0 text-brand-600 dark:text-brand-200" aria-hidden />
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="card flex flex-col items-center gap-4 bg-brand-600 px-6 py-12 text-center text-white dark:bg-brand-700">
        <h2 className="text-2xl font-semibold">Have a stack of notes to digitise?</h2>
        <p className="max-w-lg text-brand-100">Upload your first page now. It takes about ten seconds.</p>
        <Link to="/convert" className="btn bg-white px-5 py-2.5 text-base text-brand-700 hover:bg-brand-50">
          Convert handwriting <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
