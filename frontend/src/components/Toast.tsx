import { X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { ToastContext, type ToastInput, type ToastTone } from "../hooks/useToast";

interface ToastItem extends ToastInput {
  id: number;
}

const DURATION_MS: Record<ToastTone, number> = { success: 4000, info: 5000, error: 9000 };
const TONE: Record<ToastTone, { label: string; text: string; edge: string }> = {
  success: { label: "Done", text: "text-ok", edge: "border-l-ok" },
  info: { label: "Note", text: "text-ink-3", edge: "border-l-ink" },
  error: { label: "Problem", text: "text-accent", edge: "border-l-accent" },
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (toast: ToastInput) => {
      const id = ++nextId;
      setToasts((all) => [...all.slice(-3), { ...toast, id }]);
      setTimeout(() => dismiss(id), DURATION_MS[toast.tone ?? "info"]);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-start">
        {toasts.map(({ id, tone = "info", title, description }) => (
          <div
            key={id}
            role={tone === "error" ? "alert" : "status"}
            className={`sheet pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-2 py-3 pr-2 pl-4 ${TONE[tone].edge}`}
          >
            <div className="min-w-0 flex-1">
              <p className={`font-mono text-[11px] tracking-[0.08em] uppercase ${TONE[tone].text}`}>{TONE[tone].label}</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{title}</p>
              {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
            </div>
            <button type="button" className="btn-ghost p-1.5" onClick={() => dismiss(id)} aria-label="Dismiss notification">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
