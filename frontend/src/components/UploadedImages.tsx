export interface UploadedImage {
  id: string;
  url: string;
}

interface UploadedImagesProps {
  images: UploadedImage[];
}

export function UploadedImages({ images }: UploadedImagesProps) {
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
            className="size-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-neutral-950"
          >
            <img
              src={image.url}
              alt="Your upload"
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
