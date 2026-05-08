import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useSpeech — wraps Web Speech APIs.
 *
 * SpeechSynthesis (text-to-speech): universal browser support. Used for
 * reading assistant messages aloud.
 *
 * SpeechRecognition (speech-to-text): Chromium-only. Exposed only when
 * available so the UI can hide the mic button on Firefox.
 */
export function useSpeech() {
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // SpeechSynthesis is on `window.speechSynthesis` everywhere modern.
  const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const RecognitionCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const recognitionSupported = !!RecognitionCtor;

  useEffect(() => {
    if (!synthSupported) return;
    synthRef.current = window.speechSynthesis;
    return () => {
      try {
        synthRef.current?.cancel();
      } catch {
        // ignore
      }
    };
  }, [synthSupported]);

  const speak = useCallback((text) => {
    if (!synthSupported || !text) return;
    const synth = synthRef.current || window.speechSynthesis;
    try {
      synth.cancel();
      const utter = new window.SpeechSynthesisUtterance(stripForSpeech(text));
      // A calm cadence works better for older listeners.
      utter.rate = 0.95;
      utter.pitch = 1.0;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      synth.speak(utter);
    } catch {
      setIsSpeaking(false);
    }
  }, [synthSupported]);

  const stopSpeaking = useCallback(() => {
    if (!synthSupported) return;
    try {
      synthRef.current?.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, [synthSupported]);

  const startListening = useCallback((onResult, onEnd) => {
    if (!recognitionSupported) return false;
    try {
      const rec = new RecognitionCtor();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = (event) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        if (transcript && onResult) onResult(transcript);
      };
      rec.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        if (onEnd) onEnd();
      };
      rec.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
        if (onEnd) onEnd();
      };
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
      return true;
    } catch {
      setIsListening(false);
      return false;
    }
  }, [recognitionSupported, RecognitionCtor]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  return {
    synthSupported,
    recognitionSupported,
    isSpeaking,
    isListening,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}

/**
 * Strip markdown-ish syntax that would otherwise be read literally
 * (e.g., "asterisk asterisk Bold asterisk asterisk").
 */
function stripForSpeech(text) {
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
