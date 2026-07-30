import { CameraIcon, CloseIcon, CloudUploadIcon } from "./icons";

interface CameraChoicePopupProps {
  onCancel: () => void;
  onChooseCamera: () => void;
  onChooseUpload: () => void;
}

export function CameraChoicePopup({
  onCancel,
  onChooseCamera,
  onChooseUpload,
}: CameraChoicePopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs rounded-3xl border border-gold/60 bg-black px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-4 right-4 text-gold/80"
        >
          <CloseIcon className="size-4" />
        </button>

        <h2
          className="text-center text-2xl text-gold"
          style={{ fontFamily: "var(--font-serif-display)" }}
        >
          Search by Photo
        </h2>
        <p className="mt-2 text-center text-xs text-neutral-400">
          Take a new photo or upload one from your gallery.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onChooseCamera}
            className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            <CameraIcon className="size-5" />
            Camera
          </button>
          <button
            type="button"
            onClick={onChooseUpload}
            className="flex items-center justify-center gap-2 rounded-full border border-gold px-4 py-3 text-sm font-semibold text-gold"
          >
            <CloudUploadIcon className="size-5" />
            Upload Image
          </button>
        </div>
      </div>
    </div>
  );
}
