import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

const STEPS = [
  { title: "Photograph the page", text: "Up to ten pages at a time, straight from your phone camera or from files on your computer." },
  { title: "Read it back", text: "Check the text beside your photo. Find & replace and one-click cleanup take care of the usual OCR slips." },
  { title: "Take it with you", text: "Download a Word document, PDF, Markdown, HTML or plain text, ready to hand in or share." },
];

const DETAILS = [
  ["Five formats", "DOCX, PDF, TXT, MD and HTML, with font size, date and page-break options."],
  ["A proper history", "Every document is kept in this browser. Search it, filter by date or format, sort it, rename it."],
  ["Private by default", "Your documents never leave your device. The OCR key never leaves the server."],
];

const HANDWRITING = ["Tuesday — seminar notes", "Memory is reconstructive, not", "a recording. Ask: what cues", "help recall? see ch. 4"];

function Specimen() {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:mr-0" aria-hidden>
      <div className="sheet ruled relative -rotate-2 px-6 pt-6 pb-10 pl-16">
        <span className="absolute inset-y-0 left-11 w-px bg-margin" />
        {HANDWRITING.map((line) => (
          <p key={line} className="font-hand text-[26px] leading-8 text-ink-2">
            {line}
          </p>
        ))}
      </div>
      <div className="sheet relative -mt-8 ml-10 rotate-1 px-6 py-5 sm:ml-16">
        <p className="meta mb-2 uppercase">Extracted — 23 words</p>
        <p className="font-serif text-[15px] leading-relaxed">
          Tuesday — seminar notes. Memory is reconstructive, not a recording. Ask: what cues help recall? See ch. 4.
        </p>
      </div>
      <figcaption className="meta mt-4 text-right">fig. 1 — one page, read in about four seconds</figcaption>
    </figure>
  );
}

export function Home() {
  usePageTitle("");
  return (
    <div className="space-y-24">
      <section className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="meta uppercase">Handwriting → document</p>
          <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">
            Handwritten notes in. Clean documents <em className="text-accent">out.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
            Photograph a page of handwriting and InkDoc turns it into text you can edit, search and export, so nothing you wrote by hand needs retyping.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/convert" className="btn-primary px-5 py-3 text-base">
              Start converting
            </Link>
            <Link to="/history" className="text-sm text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink">
              Open your documents
            </Link>
          </div>
        </div>
        <Specimen />
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-serif text-3xl">
          How it works
        </h2>
        <ol className="mt-8 grid border-t border-ink md:grid-cols-3">
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="border-b border-rule py-6 md:border-b-0 md:border-l md:px-6 md:first:border-l-0 md:first:pl-0">
              <span className="font-serif text-4xl text-accent italic">{i + 1}</span>
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-10 md:grid-cols-[1fr_2fr]" aria-labelledby="details-heading">
        <h2 id="details-heading" className="font-serif text-3xl">
          Small things, done properly
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {DETAILS.map(([term, detail]) => (
            <div key={term} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr]">
              <dt className="font-medium">{term}</dt>
              <dd className="text-ink-2">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col items-start justify-between gap-6 border-t border-ink pt-10 sm:flex-row sm:items-end">
        <p className="max-w-xl font-serif text-3xl leading-snug">
          Got a notebook full of pages you keep meaning to type up? <span className="text-ink-3">Start with one.</span>
        </p>
        <Link to="/convert" className="btn-primary shrink-0 px-5 py-3">
          Convert a page
        </Link>
      </section>
    </div>
  );
}
