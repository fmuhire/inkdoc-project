import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { ToastContext, type ToastInput, type ToastTone } from "../hooks/useToast";

interface ToastItem extends ToastInput {
  id: number;
}

const DURATION_MS: Record<ToastTone, number> = { success: 4000, info: 5000, error: 9000 };

const STYLES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: "text-emerald-600 dark:text-emerald-400" },
  info: { icon: Info, className: "text-brand-600 dark:text-brand-200" },
  error: { icon: CircleAlert, className: "text-red-600 dark:text-red-400" },
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
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map(({ id, tone = "info", title, description }) => {
          const { icon: Icon, className } = STYLES[tone];
          return (
            <div
              key={id}
              role={tone === "error" ? "alert" : "status"}
              className="card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-4 shadow-lg"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${className}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                {description && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
              </div>
              <button type="button" className="btn-ghost -m-1 p-1" onClick={() => dismiss(id)} aria-label="Dismiss notification">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
