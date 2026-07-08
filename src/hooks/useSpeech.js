import { useCallback, useRef } from 'react'

export function useSpeech() {
  const synthRef = useRef(window.speechSynthesis)

  const speak = useCallback((text) => {
    if (!synthRef.current) return

    // Cancel any ongoing speech before starting a new one
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    // Optional: tweak pitch or rate if needed, or select voices
    // utterance.rate = 1.0;
    
    synthRef.current.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
  }, [])

  return {
    speak,
    cancel,
  }
}
