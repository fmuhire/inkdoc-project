const API_BASE = import.meta.env.DEV ? "http://localhost:8000" : "";

export const EXPORT_FORMATS = ["docx", "pdf", "txt", "md", "html"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface Health {
  status: string;
  server: string;
  ocr_configured: boolean;
  version: string;
}

export interface OcrPage {
  index: number;
  filename: string;
  text: string;
  words: number;
  cached: boolean;
  error?: { code: string; message: string };
}

export interface OcrResult {
  pages: OcrPage[];
  server: string;
}

export interface ExportOptions {
  font_size: number;
  include_date: boolean;
  page_breaks: boolean;
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly hint: string,
  ) {
    super(message);
  }
}

// Errors that will repeat for every remaining page, so the caller should stop.
export const FATAL_CODES = new Set(["ocr_not_configured", "ocr_quota_exceeded", "rate_limited", "network"]);

const COPY: Record<string, { message?: string; hint: string }> = {
  network: { message: "Can't reach the InkDoc server.", hint: "Check your connection and try again." },
  ocr_not_configured: {
    message: "Text recognition isn't set up on the server.",
    hint: "The site owner needs to add an OCR API key. Your files were not processed.",
  },
  ocr_quota_exceeded: {
    message: "The daily OCR limit has been reached.",
    hint: "Try again tomorrow. You can still edit and export saved documents.",
  },
  rate_limited: {
    message: "You're sending pages too quickly.",
    hint: "Wait a few minutes, then try again.",
  },
  ocr_unavailable: {
    message: "The OCR service is temporarily unavailable.",
    hint: "Wait a minute and try again.",
  },
  ocr_timeout: {
    message: "The OCR service took too long to respond.",
    hint: "Try again, or use a smaller, sharper photo.",
  },
  payload_too_large: { hint: "Use images under 10 MB each." },
  bad_request: { hint: "Check the file or input and try again." },
};

export function toApiError(code: string, serverMessage?: string): ApiError {
  const copy = COPY[code];
  return new ApiError(
    code,
    copy?.message ?? serverMessage ?? "Something went wrong.",
    copy?.hint ?? "Please try again in a moment.",
  );
}

export function describeError(error: unknown): { title: string; description: string } {
  const apiError = error instanceof ApiError ? error : toApiError("unknown");
  return { title: apiError.message, description: apiError.hint };
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(API_BASE + path, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw toApiError("network");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw toApiError(body?.error?.code ?? "unknown", body?.error?.message);
  }
  return response;
}

export async function getHealth(signal?: AbortSignal): Promise<Health> {
  return (await request("/api/health", { signal })).json();
}

export async function recognize(files: File[]): Promise<OcrResult> {
  const form = new FormData();
  files.forEach((file) => form.append("images", file, file.name));
  return (await request("/api/ocr", { method: "POST", body: form })).json();
}

function filenameFrom(header: string | null, fallback: string): string {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return header?.match(/filename="([^"]+)"/i)?.[1] ?? fallback;
}

export async function exportDocument(payload: {
  title: string;
  text: string;
  format: ExportFormat;
  options: ExportOptions;
}): Promise<{ blob: Blob; filename: string }> {
  const response = await request("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const filename = filenameFrom(response.headers.get("Content-Disposition"), `inkdoc.${payload.format}`);
  return { blob: await response.blob(), filename };
}
