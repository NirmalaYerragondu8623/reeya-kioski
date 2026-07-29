import { useState } from "react";
import { BRAND_NAME } from "../lib/brand";
import { isVoiceSearchSupported, startVoiceSearch } from "../lib/voiceSearch";
import { CameraIcon, DiamondIcon, MicIcon, RefreshIcon } from "./icons";

interface HeaderProps {
  onCameraClick?: () => void;
  onVoiceResult?: (transcript: string) => void;
  onNewUser?: () => void;
}

export function Header({ onCameraClick, onVoiceResult, onNewUser }: HeaderProps) {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);

  function showStatus(message: string) {
    setVoiceStatus(message);
    window.setTimeout(() => setVoiceStatus(null), 3000);
  }

  function handleMicClick() {
    if (isListening) return;

    if (!isVoiceSearchSupported()) {
      showStatus("Voice search isn't supported in this browser.");
      return;
    }

    setIsListening(true);
    setVoiceStatus("Listening...");
    startVoiceSearch(
      (transcript) => {
        showStatus(`Heard: "${transcript}"`);
        onVoiceResult?.(transcript);
      },
      () => setIsListening(false),
      (message) => showStatus(message),
    );
  }

  return (
    <header className="px-5 pt-6">
      <div>
        <p className="text-base font-medium tracking-[0.3em] text-gold/70 uppercase">
          {BRAND_NAME}
        </p>
        <h1
          className="text-4xl text-gold uppercase"
          style={{ fontFamily: "var(--font-serif-display)" }}
        >
          Reeya Diamonds
        </h1>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-gold/50 py-1.5 pr-3 pl-2">
          <button
            type="button"
            onClick={handleMicClick}
            aria-label="Search by voice"
            aria-pressed={isListening}
            className={`shrink-0 rounded-full p-0.5 ${
              isListening ? "text-red-400" : "text-gold"
            }`}
          >
            <MicIcon className={`size-5 ${isListening ? "animate-pulse" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onCameraClick}
            aria-label="Search by photo"
            className="shrink-0 rounded-full p-0.5 text-gold"
          >
            <CameraIcon className="size-5" />
          </button>
          <span className="text-[11px] leading-tight text-neutral-200">
            Search, speak
            <br />
            what you want
          </span>
        </div>

        <button
          type="button"
          onClick={onNewUser}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-[11px] font-medium text-gold/80"
        >
          <RefreshIcon className="size-3.5" />
          New User
        </button>
      </div>

      {voiceStatus && (
        <p className="mt-2 text-center text-xs text-gold/80">{voiceStatus}</p>
      )}

      <div className="mt-5 flex items-center gap-3 text-gold/60">
        <span className="h-px flex-1 bg-gold/30" />
        <DiamondIcon className="size-2.5 fill-gold stroke-none" />
        <span className="h-px flex-1 bg-gold/30" />
      </div>
    </header>
  );
}
