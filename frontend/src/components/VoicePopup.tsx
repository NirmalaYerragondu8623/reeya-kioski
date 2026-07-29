import { CloseIcon, MicIcon } from "./icons";

const WAVE_BAR_HEIGHTS = [8, 14, 20, 15, 10, 18, 13, 16, 9];

interface VoicePopupProps {
  isListening: boolean;
  transcript: string;
  errorMessage: string | null;
  onStop: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function VoicePopup({
  isListening,
  transcript,
  errorMessage,
  onStop,
  onCancel,
  onConfirm,
}: VoicePopupProps) {
  const hasTranscript = transcript.trim().length > 0;

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

        <div className="flex flex-col items-center gap-4 text-center">
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop listening"
            className="relative flex items-center justify-center"
          >
            {isListening && (
              <>
                <span className="absolute size-24 animate-ping rounded-full border border-gold/20" />
                <span className="absolute size-[88px] rounded-full border border-gold/30" />
              </>
            )}
            <span className="relative flex size-[74px] items-center justify-center rounded-full border-2 border-gold bg-black">
              <MicIcon
                className={`size-7 text-gold ${isListening ? "animate-pulse" : ""}`}
              />
            </span>
          </button>

          <h2
            className="text-2xl text-gold"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            {errorMessage ? "Voice Search" : "Listening..."}
          </h2>

          <p className="-mt-2 text-xs text-neutral-400">
            {errorMessage ?? "Speak now — tell us what you're looking for."}
          </p>

          {!errorMessage && (
            <>
              <div className="w-full rounded-xl border border-gold/30 bg-neutral-950 px-3 py-3 text-left">
                <p className="text-sm text-white italic">
                  {hasTranscript ? (
                    <>
                      "{transcript}
                      {isListening && (
                        <span className="animate-pulse not-italic">|</span>
                      )}
                      "
                    </>
                  ) : (
                    <span className="text-neutral-600">
                      Waiting for speech...
                    </span>
                  )}
                </p>
              </div>

              <div className="flex h-6 items-end justify-center gap-1">
                {WAVE_BAR_HEIGHTS.map((height, i) => (
                  <span
                    key={i}
                    className={`w-1 origin-bottom rounded-full bg-gold ${
                      isListening
                        ? "animate-[wave_1s_ease-in-out_infinite]"
                        : "opacity-40"
                    }`}
                    style={{
                      height: `${height}px`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>

              {isListening && (
                <p className="text-[11px] text-neutral-500">
                  Tap the mic to stop
                </p>
              )}
            </>
          )}

          <div className="mt-2 flex w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-full border border-gold px-4 py-2.5 text-sm font-semibold text-gold"
            >
              Cancel
            </button>
            {!errorMessage && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={!hasTranscript}
                className="flex-1 rounded-full bg-gradient-to-r from-[#b8860b] via-[#f5d78e] to-[#b8860b] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-40"
              >
                Search
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
