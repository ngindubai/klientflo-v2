"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in the DOM lib).
type SRResult = { 0: { transcript: string }; isFinal: boolean };
type SREvent = {
  resultIndex: number;
  results: ArrayLike<SRResult>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SRCtor = new () => SpeechRecognitionLike;

function getCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text. `onUpdate` is called with the live text (base text
 * plus finalized + interim speech) so the caller can mirror it into an input.
 */
export function useSpeechRecognition(onUpdate: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");
  const finalRef = useRef("");

  useEffect(() => {
    // Detect support after mount to avoid an SSR/client hydration mismatch
    // (window is unavailable during server render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getCtor() !== null);
    return () => recRef.current?.stop();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(
    (base = "") => {
      const Ctor = getCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      baseRef.current = base ? base.trimEnd() + " " : "";
      finalRef.current = "";

      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalRef.current += r[0].transcript;
          else interim += r[0].transcript;
        }
        onUpdate((baseRef.current + finalRef.current + interim).trimStart());
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);

      recRef.current = rec;
      rec.start();
      setListening(true);
    },
    [onUpdate],
  );

  const toggle = useCallback(
    (base = "") => {
      if (listening) stop();
      else start(base);
    },
    [listening, start, stop],
  );

  return { supported, listening, start, stop, toggle };
}
