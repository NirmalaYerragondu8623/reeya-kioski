import { useCallback, useRef, useState } from "react";
import { CameraIcon, CloudUploadIcon, SparkleIcon } from "./icons";

interface UploadPanelProps {
  onSelect: (file: File) => void;
  disabled?: boolean;
  previewUrl?: string | null;
}

export function UploadPanel({
  onSelect,
  disabled,
  previewUrl,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file && file.type.startsWith("image/")) {
        onSelect(file);
      }
    },
    [onSelect],
  );

  return (
    <section className="mx-5 mt-6 rounded-2xl border border-gold/40 px-4 py-6 text-center">
      <div className="flex items-center justify-center gap-2 text-gold">
        <CameraIcon className="size-5" />
        <h2 className="text-sm font-bold tracking-wider uppercase">
          Upload my image
        </h2>
      </div>
      <p className="mx-auto mt-2 max-w-xs text-xs text-neutral-400">
        Upload a photo of the jewelry you like and we'll find the most
        similar designs for you.
      </p>

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
          isDragging ? "border-gold bg-gold/10" : "border-gold/50"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected jewelry"
            className="max-h-32 rounded-lg object-contain"
          />
        ) : (
          <>
            <CloudUploadIcon className="size-9 text-gold" />
            <p className="text-sm font-medium text-gold">
              Tap to upload or drag and drop
            </p>
            <p className="text-xs text-neutral-500">JPG, PNG up to 10MB</p>
          </>
        )}
      </div>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs text-gold">
        <SparkleIcon className="size-3.5" />
        We'll show you the most similar designs instantly
      </div>
    </section>
  );
}
