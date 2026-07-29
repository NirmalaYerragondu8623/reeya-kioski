interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [alternativeIndex: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [resultIndex: number]: SpeechRecognitionResultLike;
  };
}

interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceSearchSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

/**
 * Starts listening and streams transcript updates as they arrive (both
 * interim and final chunks, concatenated) so the UI can show live
 * transcription. Returns a stop() callback the UI can call early (e.g. the
 * user tapping the mic again to stop manually).
 */
export function startVoiceSearch(
  onResult: (transcript: string, isFinal: boolean) => void,
  onEnd?: () => void,
  onError?: (message: string) => void,
): () => void {
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition) {
    onError?.("Voice search isn't supported in this browser.");
    return () => {};
  }

  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let combined = "";
    let isFinal = false;
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      combined += result[0]?.transcript ?? "";
      if (result.isFinal) isFinal = true;
    }
    onResult(combined.trim(), isFinal);
  };
  recognition.onerror = (event) => {
    onError?.(
      event.error === "not-allowed"
        ? "Microphone access was denied."
        : "Couldn't hear that — try again.",
    );
  };
  recognition.onend = () => onEnd?.();

  recognition.start();
  return () => recognition.stop();
}
