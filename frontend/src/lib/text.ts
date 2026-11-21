export const PAGE_BREAK = "\f";
const COMBINED_MARKER = "──────── page break ────────";
const WORDS_PER_MINUTE = 200;

export const splitPages = (text: string) => text.split(PAGE_BREAK);
export const joinPages = (pages: string[]) => pages.join(PAGE_BREAK);

export const toCombined = (text: string) => splitPages(text).join(`\n\n${COMBINED_MARKER}\n\n`);
export const fromCombined = (value: string) =>
  value.split(new RegExp(`\\n*${COMBINED_MARKER}\\n*`)).join(PAGE_BREAK);

export const toPlainText = (text: string) => splitPages(text).join("\n\n");

export function countWords(text: string): number {
  return text.match(/\S+/g)?.length ?? 0;
}

export function countChars(text: string): number {
  return text.replaceAll(PAGE_BREAK, "").length;
}

export function readingMinutes(words: number): number {
  return words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function trimSpaces(text: string): string {
  return splitPages(text)
    .map((page) =>
      page
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    )
    .join(PAGE_BREAK);
}

// Rejoins words hyphenated across lines, then merges single line breaks but keeps paragraphs.
export function joinBrokenLines(text: string): string {
  return text.replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2").replace(/([^\n])\n(?!\n)/g, "$1 ");
}

export function sentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|[.!?][\s\f]+|\n\s*|\f\s*)(\p{Ll})/gu, (_, lead: string, letter: string) => lead + letter.toUpperCase())
    .replace(/\bi\b/g, "I");
}

export const upperCase = (text: string) => text.toUpperCase();
export const lowerCase = (text: string) => text.toLowerCase();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function pattern(query: string, caseSensitive: boolean): RegExp {
  return new RegExp(escapeRegExp(query), caseSensitive ? "g" : "gi");
}

export function countMatches(text: string, query: string, caseSensitive: boolean): number {
  return query ? (text.match(pattern(query, caseSensitive))?.length ?? 0) : 0;
}

export function replaceAll(text: string, query: string, replacement: string, caseSensitive: boolean) {
  // A replacer function stops "$&"-style tokens in the replacement being interpreted.
  return query ? text.replace(pattern(query, caseSensitive), () => replacement) : text;
}

export interface Segment {
  text: string;
  match: boolean;
}

export function highlight(text: string, query: string): Segment[] {
  if (!query) return [{ text, match: false }];
  const re = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text
    .split(re)
    .filter(Boolean)
    .map((part) => ({ text: part, match: part.toLowerCase() === query.toLowerCase() }));
}

export function snippet(text: string, query: string, radius = 70): string {
  const flat = toPlainText(text).replace(/\s+/g, " ").trim();
  const at = query ? flat.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return flat.length > radius * 2 ? `${flat.slice(0, radius * 2)}…` : flat;
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + query.length + radius);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}
