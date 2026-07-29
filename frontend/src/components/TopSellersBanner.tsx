import { CATEGORY_IMAGES } from "../lib/categoryImages";

export function TopSellersBanner() {
  return (
    <section className="mx-5 mt-6 overflow-hidden rounded-2xl border border-gold/30">
      <div className="relative h-52">
        <img
          src={CATEGORY_IMAGES.Necklace}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/50" />
        <div className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 text-center">
          <h2
            className="text-lg font-bold tracking-[0.15em] text-gold uppercase"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            Our Top Selling Ornaments
          </h2>
          <span className="mx-auto mt-2 block h-px w-16 bg-gold/60" />
        </div>
      </div>
    </section>
  );
}
