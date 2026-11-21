import { createContext, useContext } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  tone?: ToastTone;
  title: string;
  description?: string;
}

export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function useToast(): (toast: ToastInput) => void {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside ToastProvider");
  return notify;
}
