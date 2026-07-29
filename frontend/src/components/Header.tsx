import { useRef, useState } from "react";
import { isVoiceSearchSupported, startVoiceSearch } from "../lib/voiceSearch";
import { CameraIcon, DiamondIcon, MicIcon, RefreshIcon } from "./icons";
import { VoicePopup } from "./VoicePopup";

interface HeaderProps {
  onCameraClick?: () => void;
  onVoiceResult?: (transcript: string) => void;
  onNewUser?: () => void;
}

export function Header({ onCameraClick, onVoiceResult, onNewUser }: HeaderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const isPopupOpen = isListening || transcript.length > 0 || errorMessage !== null;

  function resetVoiceState() {
    setIsListening(false);
    setTranscript("");
    setErrorMessage(null);
    stopRef.current = null;
  }

  function handleMicClick() {
    if (isListening) return;

    setTranscript("");
    setErrorMessage(null);

    if (!isVoiceSearchSupported()) {
      setErrorMessage("Voice search isn't supported in this browser.");
      return;
    }

    setIsListening(true);
    stopRef.current = startVoiceSearch(
      (text) => setTranscript(text),
      () => setIsListening(false),
      (message) => {
        setErrorMessage(message);
        setIsListening(false);
      },
    );
  }

  function handleStop() {
    stopRef.current?.();
  }

  function handleCancel() {
    stopRef.current?.();
    resetVoiceState();
  }

  function handleConfirm() {
    stopRef.current?.();
    onVoiceResult?.(transcript);
    resetVoiceState();
  }

  return (
    <header className="px-5 pt-6">
      <h1
        className="text-4xl text-gold uppercase"
        style={{ fontFamily: "var(--font-serif-display)" }}
      >
        Reeya Diamonds
      </h1>

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

      <div className="mt-5 flex items-center gap-3 text-gold/60">
        <span className="h-px flex-1 bg-gold/30" />
        <DiamondIcon className="size-2.5 fill-gold stroke-none" />
        <span className="h-px flex-1 bg-gold/30" />
      </div>

      {isPopupOpen && (
        <VoicePopup
          isListening={isListening}
          transcript={transcript}
          errorMessage={errorMessage}
          onStop={handleStop}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </header>
  );
}
