import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      className="card m-auto w-[calc(100%-2rem)] max-w-md p-6 text-slate-900 backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:text-slate-100"
    >
      <h2 id="confirm-title" className="text-lg font-semibold">
        {title}
      </h2>
      <p id="confirm-description" className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
