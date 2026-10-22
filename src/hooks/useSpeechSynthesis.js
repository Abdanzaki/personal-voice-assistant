import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook wrapping window.speechSynthesis.
 * Picks a reasonable default English voice and reliably tracks speaking state.
 */
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const activeUtteranceRef = useRef(null)
  const voicesRef = useRef([])

  const selectEnglishVoice = useCallback((voices) => {
    if (!voices || voices.length === 0) return null

    // Look for preferred natural / modern English voices
    const preferredNames = [
      'Google US English',
      'Samantha',
      'Daniel',
      'Karen',
      'Alex',
      'Microsoft David',
      'Microsoft Zira',
      'Natural',
    ]

    for (const name of preferredNames) {
      const match = voices.find((v) => v.name.includes(name))
      if (match) return match
    }

    // Default English voice
    const englishDefault = voices.find(
      (v) => v.lang.startsWith('en') && v.default
    )
    if (englishDefault) return englishDefault

    // Any English voice
    const anyEnglish = voices.find((v) => v.lang.startsWith('en'))
    if (anyEnglish) return anyEnglish

    return voices[0] || null
  }, [])

  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices()
        if (available && available.length > 0) {
          voicesRef.current = available
        }
      } catch (err) {
        console.warn('Error loading speech synthesis voices:', err)
      }
    }

    loadVoices()

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Safe cleanup
      }
    }
  }, [isSupported])

  const cancel = useCallback(() => {
    if (!isSupported) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Ignore
    }
    activeUtteranceRef.current = null
    setSpeaking(false)
  }, [isSupported])

  const speak = useCallback(
    (text) => {
      if (!isSupported || !text) return

      // Cancel previous playback to avoid queue overlaps
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Ignore
      }

      // If voices haven't loaded yet, try fetching them
      if (voicesRef.current.length === 0) {
        try {
          voicesRef.current = window.speechSynthesis.getVoices() || []
        } catch {
          // Ignore
        }
      }

      const utterance = new SpeechSynthesisUtterance(text)
      activeUtteranceRef.current = utterance

      const chosenVoice = selectEnglishVoice(voicesRef.current)
      if (chosenVoice) {
        utterance.voice = chosenVoice
        utterance.lang = chosenVoice.lang
      } else {
        utterance.lang = 'en-US'
      }

      utterance.rate = 1.0
      utterance.pitch = 1.0

      utterance.onstart = () => {
        setSpeaking(true)
      }

      utterance.onend = () => {
        setSpeaking(false)
        activeUtteranceRef.current = null
      }

      utterance.onerror = () => {
        // Canceled or interrupted utterances should gracefully reset state
        setSpeaking(false)
        activeUtteranceRef.current = null
      }

      try {
        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.warn('Speech synthesis playback error:', err)
        setSpeaking(false)
        activeUtteranceRef.current = null
      }
    },
    [isSupported, selectEnglishVoice]
  )

  return {
    speak,
    cancel,
    speaking,
    supported: isSupported,
  }
}
