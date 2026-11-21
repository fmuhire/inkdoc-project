import { Camera, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  hint: string;
}

export function Dropzone({ onFiles, disabled = false, hint }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (list: FileList | null) => {
    if (list?.length) onFiles(Array.from(list));
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) take(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
        dragging
          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
          : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="mb-4 rounded-full bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10 dark:text-brand-200">
        <Upload className="size-7" aria-hidden />
      </div>
      <p className="text-base font-semibold">Drop photos of handwritten pages here</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => fileInput.current?.click()} disabled={disabled}>
          <Upload className="size-4" aria-hidden />
          Choose files
        </button>
        <button type="button" className="btn-secondary" onClick={() => cameraInput.current?.click()} disabled={disabled}>
          <Camera className="size-4" aria-hidden />
          Take photo
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label="Choose image files"
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        aria-label="Take a photo"
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
