import { ExternalLink } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

const STACK = [
  ["Frontend", "React, TypeScript, Vite, Tailwind CSS, React Router, Lucide icons"],
  ["Backend", "Python, FastAPI, httpx, Pillow, python-docx, fpdf2, slowapi"],
  ["Infrastructure", "Two Ubuntu web servers (nginx + gunicorn) behind an HAProxy load balancer"],
];

function ExternalAnchor({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-200">
      {children}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

export function About() {
  usePageTitle("About");
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">About InkDoc</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Students, researchers and professionals still think best with a pen, but sharing handwritten notes means retyping them. InkDoc removes
          that step: photograph the page, check the text, export a document.
        </p>
      </header>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Powered by Pen to Print</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Handwriting recognition is provided by the <ExternalAnchor href="https://rapidapi.com/serendi/api/pen-to-print-handwriting-ocr">Pen to Print Handwriting OCR API</ExternalAnchor>{" "}
          by Serendi, accessed through <ExternalAnchor href="https://rapidapi.com">RapidAPI</ExternalAnchor>. Images are cleaned up on our server
          (rotation, contrast, resizing) before they are sent, and identical pages are cached for 24 hours so they are never processed twice.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Privacy</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Your documents are saved only in this browser's local storage. Photos are sent to the OCR service for recognition and are not stored by
          InkDoc. The API key lives on the server and is never exposed to your browser.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Built with</h2>
        <dl className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {STACK.map(([term, detail]) => (
            <div key={term} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="font-medium">{term}</dt>
              <dd className="text-slate-600 dark:text-slate-400">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
