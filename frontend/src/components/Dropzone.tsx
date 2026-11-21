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
      className={`sheet ruled relative overflow-hidden px-6 py-14 pl-16 transition-[outline-color] sm:pl-20 ${
        dragging ? "outline-2 -outline-offset-8 outline-dashed outline-accent" : "outline-transparent"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span className="absolute inset-y-0 left-10 w-px bg-margin sm:left-14" aria-hidden />
      <p className="font-hand text-3xl leading-8 text-ink-2 sm:text-4xl">{dragging ? "Let go to add them…" : "Drop your pages here"}</p>
      <p className="mt-2 max-w-md text-sm leading-8 text-ink-2">Photos of handwritten pages, in reading order. Good light and a flat page help the most.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => fileInput.current?.click()} disabled={disabled}>
          Choose files
        </button>
        <button type="button" className="btn-secondary bg-sheet" onClick={() => cameraInput.current?.click()} disabled={disabled}>
          Take photo
        </button>
      </div>
      <p className="meta mt-5 leading-8">{hint}</p>
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
