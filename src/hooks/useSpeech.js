import { useState, useCallback, useEffect, useRef } from 'react';

export const useSpeech = () => {
  const [speaking, setSpeaking] = useState(null);
  const voicesRef = useRef([]);

  // Load voices — they load asynchronously in browsers
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices(); // try immediately
    window.speechSynthesis.onvoiceschanged = loadVoices; // also on change
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = useCallback((text, langCode) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Find best matching voice for the language
    const voices = voicesRef.current;
    const exactMatch = voices.find(v => v.lang === langCode);
    const prefixMatch = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    const matchedVoice = exactMatch || prefixMatch;

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.lang = langCode;
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.onstart = () => setSpeaking(langCode);
    utterance.onend = () => setSpeaking(null);
    utterance.onerror = () => setSpeaking(null);

    // Small delay fixes Tamil not speaking on first click (Chrome bug)
    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(null);
  }, []);

  return { speak, stop, speaking };
};
