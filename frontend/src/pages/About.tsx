import type { ReactNode } from "react";
import { usePageTitle } from "../hooks/usePageTitle";

const STACK = [
  ["Interface", "React, TypeScript, Vite, Tailwind CSS, React Router"],
  ["Server", "Python, FastAPI, httpx, Pillow, python-docx, fpdf2, SlowAPI"],
  ["Hosting", "Two Ubuntu web servers running nginx and gunicorn, behind an HAProxy load balancer"],
  ["Type", "Fraunces, IBM Plex Sans and Mono, Caveat"],
];

function Anchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-4 hover:decoration-accent">
      {children}
    </a>
  );
}

export function About() {
  usePageTitle("About");
  return (
    <article className="mx-auto max-w-2xl">
      <p className="meta uppercase">About</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl">About InkDoc</h1>
      <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-ink-2">
        <p className="text-xl text-ink">
          Plenty of people still think best with a pen. The trouble starts when the notes need to be shared, submitted or searched, because then
          they have to be typed up again.
        </p>
        <p>
          InkDoc skips that step. Photograph the page, check the text against your photo, and export a document. It's built for students handing in
          notes, researchers digitising notebooks, and anyone with a drawer of pages they'd like to be able to search.
        </p>
      </div>

      <h2 className="mt-14 border-t border-ink pt-6 font-serif text-2xl">Where the reading happens</h2>
      <p className="mt-3 leading-relaxed text-ink-2">
        Handwriting recognition is done by the <Anchor href="https://rapidapi.com/serendi/api/pen-to-print-handwriting-ocr">Pen to Print Handwriting OCR API</Anchor>{" "}
        by Serendi, through <Anchor href="https://rapidapi.com">RapidAPI</Anchor>. Before a photo is sent, our server straightens it, converts it to
        greyscale, boosts the contrast and resizes it. Identical pages are cached for 24 hours, so the same page is never read twice.
      </p>

      <h2 className="mt-12 border-t border-ink pt-6 font-serif text-2xl">Privacy</h2>
      <p className="mt-3 leading-relaxed text-ink-2">
        Your documents are stored only in this browser. Photos go to the OCR service to be read and are not kept by InkDoc. The API key stays on the
        server and never reaches your browser.
      </p>

      <h2 className="mt-12 border-t border-ink pt-6 font-serif text-2xl">Colophon</h2>
      <dl className="mt-4 divide-y divide-rule border-y border-rule">
        {STACK.map(([term, detail]) => (
          <div key={term} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
            <dt className="label mt-1 mb-0">{term}</dt>
            <dd className="text-ink-2">{detail}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
