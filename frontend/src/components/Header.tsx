import { useRef, useState } from "react";
import { trackEvent } from "../lib/analytics";
import { isVoiceSearchSupported, startVoiceSearch } from "../lib/voiceSearch";
import { CameraChoicePopup } from "./CameraChoicePopup";
import { CameraIcon, MicIcon, PlusIcon, SearchIcon } from "./icons";
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
    <header className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-center px-5">
        <img
          src="/logo.png"
          alt="Reeya Diamonds"
          className="h-32 w-auto object-contain"
        />
      </div>

      <div className="flex items-center justify-between px-10">
        <div className="ml-[5%] flex shrink-0 items-center gap-4 rounded-full border border-gold/50 py-3 pr-5 pl-4">
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
          aria-label="New user"
          className="mr-[5%] flex size-16 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold/80"
        >
          <PlusIcon className="size-7" />
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
