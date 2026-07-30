import { CloseIcon } from "./icons";

export interface UploadedImage {
  id: string;
  url: string;
}

interface UploadedImagesProps {
  images: UploadedImage[];
  onRemove?: (id: string) => void;
}

export function UploadedImages({ images, onRemove }: UploadedImagesProps) {
  if (images.length === 0) return null;

  return (
    <section className="mx-5 mt-6">
      <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
        Your uploaded images
      </p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-neutral-950"
          >
            <img
              src={image.url}
              alt="Your upload"
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove?.(image.id)}
              aria-label="Remove uploaded image"
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <CloseIcon className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
