import type { ExportFormat } from "./api";

export interface ExportRecord {
  format: ExportFormat;
  at: string;
}

export interface HistoryDoc {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pages: number;
  words: number;
  text: string;
  filenames: string[];
  server: string;
  cachedPages: number;
  exports: ExportRecord[];
}

const KEY = "inkdoc:history";

// crypto.randomUUID only exists on HTTPS/localhost, and the site is also served over plain HTTP.
export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
const listeners = new Set<() => void>();
let snapshot: HistoryDoc[] | null = null;

function read(): HistoryDoc[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as HistoryDoc[]) : [];
  } catch {
    return [];
  }
}

function write(docs: HistoryDoc[]): boolean {
  snapshot = docs;
  let persisted = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(docs));
  } catch {
    persisted = false;
  }
  listeners.forEach((listener) => listener());
  return persisted;
}

export function getDocs(): HistoryDoc[] {
  snapshot ??= read();
  return snapshot;
}

export function subscribe(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    snapshot = null;
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function addDoc(doc: HistoryDoc): boolean {
  return write([doc, ...getDocs()]);
}

export function updateDoc(id: string, patch: Partial<HistoryDoc>): boolean {
  return write(getDocs().map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)));
}

export function recordExport(id: string, format: ExportFormat): void {
  const doc = getDocs().find((d) => d.id === id);
  if (doc) updateDoc(id, { exports: [...doc.exports, { format, at: new Date().toISOString() }] });
}

export function deleteDoc(id: string): void {
  write(getDocs().filter((doc) => doc.id !== id));
}

export function clearDocs(): void {
  write([]);
}

// Object URLs for page photos only live as long as the tab, so they stay out of localStorage.
const sessionImages = new Map<string, string[]>();

export function rememberImages(id: string, urls: string[]): void {
  sessionImages.set(id, urls);
}

export function imagesFor(id: string): string[] {
  return sessionImages.get(id) ?? [];
}
