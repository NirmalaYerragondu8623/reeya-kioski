import { useRef, useState } from "react";
import { isVoiceSearchSupported, startVoiceSearch } from "../lib/voiceSearch";
import { CameraIcon, MicIcon, SearchIcon } from "./icons";
import { SearchPopup } from "./SearchPopup";
import { VoicePopup } from "./VoicePopup";

interface HeaderProps {
  onCameraClick?: () => void;
  onVoiceResult?: (transcript: string) => void;
}

export function Header({ onCameraClick, onVoiceResult }: HeaderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  function handleSearchSubmit(query: string) {
    setIsSearchOpen(false);
    onVoiceResult?.(query);
  }

  return (
    <header className="px-5 pt-2">
      <img
        src="/logo.png"
        alt="Reeya Diamonds"
        className="mx-auto h-20 w-auto object-contain"
      />

      <div className="-mt-1 flex justify-end">
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-gold/50 py-1 pr-2 pl-1.5">
          <button
            type="button"
            onClick={handleMicClick}
            aria-label="Search by voice"
            aria-pressed={isListening}
            className={`shrink-0 rounded-full p-0.5 ${
              isListening ? "text-red-400" : "text-gold"
            }`}
          >
            <MicIcon className={`size-4 ${isListening ? "animate-pulse" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onCameraClick}
            aria-label="Search by photo"
            className="shrink-0 rounded-full p-0.5 text-gold"
          >
            <CameraIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search by typing"
            className="shrink-0 rounded-full p-0.5 text-gold"
          >
            <SearchIcon className="size-4" />
          </button>
        </div>
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

      {isSearchOpen && (
        <SearchPopup
          onCancel={() => setIsSearchOpen(false)}
          onSubmit={handleSearchSubmit}
        />
      )}
    </header>
  );
}
