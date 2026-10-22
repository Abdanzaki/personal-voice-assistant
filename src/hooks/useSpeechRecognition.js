import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook wrapping window.SpeechRecognition / window.webkitSpeechRecognition.
 * Supports continuous listening, interim results, and auto-restart loop protection.
 */
export function useSpeechRecognition(options = {}) {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [listening, setListening] = useState(false)

  const isSupported = typeof window !== 'undefined' && Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  )

  const recognitionRef = useRef(null)
  const isListeningDesiredRef = useRef(false)
  const restartAttemptsRef = useRef(0)
  const lastRestartTimeRef = useRef(0)
  const restartTimerRef = useRef(null)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  const stop = useCallback(() => {
    isListeningDesiredRef.current = false
    clearRestartTimer()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Recognition already stopped
      }
    }
    setListening(false)
    setInterimTranscript('')
  }, [clearRestartTimer])

  const start = useCallback(() => {
    if (!isSupported) return
    isListeningDesiredRef.current = true
    restartAttemptsRef.current = 0
    clearRestartTimer()

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch {
        // May already be active or starting
      }
    }
  }, [isSupported, clearRestartTimer])

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition

    let recognition = null
    try {
      recognition = new SpeechRecognitionClass()
    } catch (err) {
      console.warn('SpeechRecognition initialization failed:', err)
      return
    }

    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = optionsRef.current?.lang || 'en-US'

    recognition.onstart = () => {
      setListening(true)
      restartAttemptsRef.current = 0
    }

    recognition.onresult = (event) => {
      let finalSegment = ''
      let interimSegment = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i]
        const speechText = item[0]?.transcript || ''
        if (item.isFinal) {
          finalSegment += speechText
        } else {
          interimSegment += speechText
        }
      }

      if (finalSegment.trim()) {
        const trimmed = finalSegment.trim()
        setTranscript((prev) => (prev ? `${prev} ${trimmed}` : trimmed))
        setInterimTranscript('')

        if (typeof optionsRef.current?.onFinalResult === 'function') {
          optionsRef.current.onFinalResult(trimmed)
        }
      } else {
        setInterimTranscript(interimSegment)
      }
    }

    recognition.onerror = (event) => {
      // Hardware/permission errors are fatal; stop auto-restart
      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed' ||
        event.error === 'audio-capture'
      ) {
        isListeningDesiredRef.current = false
        setListening(false)
        clearRestartTimer()
        return
      }
      // 'no-speech', 'aborted', or network hiccups can occur normally
    }

    recognition.onend = () => {
      if (!isListeningDesiredRef.current) {
        setListening(false)
        return
      }

      // Guard against rapid restart loops
      const now = Date.now()
      if (now - lastRestartTimeRef.current < 1200) {
        restartAttemptsRef.current += 1
      } else {
        restartAttemptsRef.current = 1
      }
      lastRestartTimeRef.current = now

      if (restartAttemptsRef.current > 6) {
        console.warn('Speech recognition restarted too rapidly. Halting auto-restart loop.')
        isListeningDesiredRef.current = false
        setListening(false)
        return
      }

      clearRestartTimer()
      restartTimerRef.current = setTimeout(() => {
        if (isListeningDesiredRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start()
          } catch {
            // Already started or busy
          }
        }
      }, 300)
    }

    return () => {
      isListeningDesiredRef.current = false
      clearRestartTimer()
      try {
        recognition.stop()
      } catch {
        // Safe unmount
      }
      recognitionRef.current = null
    }
  }, [isSupported, clearRestartTimer])

  return {
    transcript,
    interimTranscript,
    listening,
    supported: isSupported,
    start,
    stop,
    resetTranscript,
  }
}
