import { useRef, useState } from "react";
import { trackEvent } from "../lib/analytics";
import { isVoiceSearchSupported, startVoiceSearch } from "../lib/voiceSearch";
import { CameraChoicePopup } from "./CameraChoicePopup";
import { CameraIcon, MicIcon, RefreshIcon, SearchIcon } from "./icons";
import { SearchPopup } from "./SearchPopup";
import { VoicePopup } from "./VoicePopup";

interface HeaderProps {
  onCameraClick?: () => void;
  onUploadClick?: () => void;
  onVoiceResult?: (query: string, source: "voice" | "text") => void;
  onNewUser?: () => void;
}

export function Header({ onCameraClick, onUploadClick, onVoiceResult, onNewUser }: HeaderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCameraChoiceOpen, setIsCameraChoiceOpen] = useState(false);
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
    trackEvent("voice_search_started", {});

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

  function handleCameraIconClick() {
    setIsCameraChoiceOpen(true);
  }

  function handleChooseCamera() {
    setIsCameraChoiceOpen(false);
    trackEvent("image_search_started", { source: "camera" });
    onCameraClick?.();
  }

  function handleChooseUpload() {
    setIsCameraChoiceOpen(false);
    trackEvent("image_search_started", { source: "upload" });
    onUploadClick?.();
  }

  function handleTextSearchClick() {
    trackEvent("text_search_opened", {});
    setIsSearchOpen(true);
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
    onVoiceResult?.(transcript, "voice");
    resetVoiceState();
  }

  function handleSearchSubmit(query: string) {
    setIsSearchOpen(false);
    onVoiceResult?.(query, "text");
  }

  return (
    <header className="px-5 pt-2">
      <img
        src="/logo.png"
        alt="Reeya Diamonds"
        className="mx-auto h-32 w-auto object-contain"
      />

      <div className="-mt-2 flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-4 rounded-full border border-gold/50 py-3 pr-5 pl-4">
          <button
            type="button"
            onClick={handleMicClick}
            aria-label="Search by voice"
            aria-pressed={isListening}
            className={`shrink-0 rounded-full p-0.5 ${
              isListening ? "text-red-400" : "text-gold"
            }`}
          >
            <MicIcon className={`size-10 ${isListening ? "animate-pulse" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleCameraIconClick}
            aria-label="Search by photo"
            className="shrink-0 rounded-full p-0.5 text-gold"
          >
            <CameraIcon className="size-10" />
          </button>
          <button
            type="button"
            onClick={handleTextSearchClick}
            aria-label="Search by typing"
            className="shrink-0 rounded-full p-0.5 text-gold"
          >
            <SearchIcon className="size-10" />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewUser}
          className="flex shrink-0 items-center gap-2 rounded-full border border-gold/40 px-6 py-3 text-lg font-medium text-gold/80"
        >
          <RefreshIcon className="size-7" />
          New User
        </button>
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

      {isCameraChoiceOpen && (
        <CameraChoicePopup
          onCancel={() => setIsCameraChoiceOpen(false)}
          onChooseCamera={handleChooseCamera}
          onChooseUpload={handleChooseUpload}
        />
      )}
    </header>
  );
}
