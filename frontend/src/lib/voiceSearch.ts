interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
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

/** Starts listening once and returns a stop() callback. */
export function startVoiceSearch(
  onResult: (transcript: string) => void,
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
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    if (transcript) onResult(transcript);
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
