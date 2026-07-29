import { BRAND_NAME, BRAND_TAGLINE } from "../lib/brand";
import {
  ArrowRightIcon,
  BangleIcon,
  BraceletIcon,
  ChevronDownIcon,
  DiamondIcon,
  EarringsIcon,
  NecklaceIcon,
  RingIcon,
} from "./icons";

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-black px-6 text-center text-white">
      {/* ambient glows */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--color-gold), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full opacity-15 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--color-gold-soft), transparent 70%)",
        }}
      />

      {/* frame corners */}
      <span className="pointer-events-none absolute top-6 left-6 size-6 border-t-2 border-l-2 border-gold/40" />
      <span className="pointer-events-none absolute top-6 right-6 size-6 border-t-2 border-r-2 border-gold/40" />
      <span className="pointer-events-none absolute bottom-6 left-6 size-6 border-b-2 border-l-2 border-gold/40" />
      <span className="pointer-events-none absolute bottom-6 right-6 size-6 border-b-2 border-r-2 border-gold/40" />

      {/* ambient jewelry scatter */}
      <div className="pointer-events-none absolute top-16 left-7 animate-[float_7s_ease-in-out_infinite]">
        <EarringsIcon className="size-9 rotate-[-12deg] text-gold opacity-20" />
      </div>
      <div className="pointer-events-none absolute top-28 right-9 animate-[float_8s_ease-in-out_0.6s_infinite]">
        <RingIcon className="size-8 rotate-[10deg] text-gold opacity-20" />
      </div>
      <div className="pointer-events-none absolute right-10 bottom-44 animate-[float_6.5s_ease-in-out_0.3s_infinite]">
        <NecklaceIcon className="size-10 rotate-[6deg] text-gold opacity-20" />
      </div>
      <div className="pointer-events-none absolute bottom-36 left-8 animate-[float_9s_ease-in-out_0.9s_infinite]">
        <BangleIcon className="size-11 rotate-[-6deg] text-gold opacity-20" />
      </div>
      <div className="pointer-events-none absolute right-7 bottom-28 animate-[float_7.5s_ease-in-out_1.2s_infinite]">
        <BraceletIcon className="size-10 rotate-[8deg] text-gold opacity-20" />
      </div>

      <div className="relative flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-7 py-16">
        {/* emblem badge */}
        <div
          className="animate-enter relative flex items-center justify-center"
          style={{ animationDelay: "0ms" }}
        >
          <span className="absolute size-24 rounded-full border border-dashed border-gold/25 [animation-duration:18s] motion-safe:animate-spin" />
          <span className="absolute size-19 rounded-full border border-gold/30" />
          <div className="flex size-16 items-center justify-center rounded-full border border-gold/60 bg-gradient-to-b from-neutral-900 to-black">
            <DiamondIcon className="size-8 text-gold" />
          </div>
        </div>

        <div
          className="animate-enter flex flex-col items-center gap-3"
          style={{ animationDelay: "120ms" }}
        >
          <h1
            className="text-shimmer text-7xl leading-none"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            {BRAND_NAME}
          </h1>
          <p className="max-w-[230px] text-xs font-medium tracking-[0.25em] text-neutral-300 uppercase">
            {BRAND_TAGLINE}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="h-px w-8 bg-gold/40" />
            <DiamondIcon className="size-2 fill-gold stroke-none" />
            <span className="h-px w-8 bg-gold/40" />
          </div>
        </div>

        <p
          className="animate-enter max-w-xs text-sm text-neutral-400"
          style={{ animationDelay: "240ms" }}
        >
          Snap a photo of a design you love and we'll find the closest match
          in our collection — instantly.
        </p>

        <button
          type="button"
          onClick={onEnter}
          className="animate-enter group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#b8860b] via-[#f5d78e] to-[#b8860b] px-9 py-3.5 text-sm font-semibold tracking-wide text-black uppercase shadow-[0_0_30px_-6px_rgba(212,175,55,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_42px_-6px_rgba(212,175,55,0.8)] active:scale-[0.97]"
          style={{ animationDelay: "360ms" }}
        >
          Explore Collection
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        <div
          className="animate-enter absolute bottom-6 flex flex-col items-center gap-1 text-neutral-500"
          style={{ animationDelay: "600ms" }}
        >
          <span className="text-[11px] tracking-widest uppercase">
            Tap to begin
          </span>
          <ChevronDownIcon className="size-4 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
