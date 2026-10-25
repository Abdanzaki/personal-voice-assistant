import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ASSISTANT_NAME } from './config.js'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis.js'
import { routeCommand, extractWakeCommand } from './lib/commandRouter.js'
import { fetchWikipediaSummary, fetchWeather } from './lib/services.js'
import { sendChatMessage } from './lib/chatService.js'
import { Orb } from './components/Orb.jsx'
import { Transcript } from './components/Transcript.jsx'
import { Controls } from './components/Controls.jsx'
import { BrowserNotice } from './components/BrowserNotice.jsx'

export default function App() {
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const [aiOffline, setAiOffline] = useState(false)
  const [wakeWordMode, setWakeWordMode] = useState(false)

  const { speak, cancel, speaking, supported: ttsSupported } = useSpeechSynthesis()

  const speakingRef = useRef(speaking)
  useEffect(() => {
    speakingRef.current = speaking
  }, [speaking])

  const wakeWordModeRef = useRef(wakeWordMode)
  useEffect(() => {
    wakeWordModeRef.current = wakeWordMode
  }, [wakeWordMode])

  // Track last spoken assistant reply for 'repeat' command
  const lastReplyRef = useRef('')

  // Process command pipeline (used for both voice and typed commands)
  const handleCommand = useCallback(
    async (input) => {
      const trimmed = (input || '').trim()
      if (!trimmed) return

      const timeStr = new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })

      // 1. Append user utterance
      const userMessage = {
        sender: 'user',
        text: trimmed,
        time: timeStr,
      }

      // 2. Route command through pure router
      const result = routeCommand(trimmed)
      const { reply, action } = result

      // 3. Action: stop-speaking -> cancel speech synthesis (and do not speak anything new)
      if (action?.type === 'stop-speaking') {
        cancel()
        setThinking(false)
        setMessages((prev) => [...prev, userMessage])
        return
      }

      // 4. Action: repeat -> re-speak the last assistant reply (tracked in ref)
      if (action?.type === 'repeat') {
        const textToRepeat = lastReplyRef.current || "I haven't said anything yet."
        const assistantMessage = {
          sender: 'assistant',
          text: textToRepeat,
          time: timeStr,
        }
        setMessages((prev) => [...prev, userMessage, assistantMessage])
        speak(textToRepeat)
        return
      }

      // 5. Action: wikipedia or weather (async external services)
      if (action?.type === 'wikipedia' || action?.type === 'weather') {
        // Append user's transcript line and activate thinking/loading indicator
        setMessages((prev) => [...prev, userMessage])
        setThinking(true)

        try {
          const responseText =
            action.type === 'weather'
              ? await fetchWeather(action.city)
              : await fetchWikipediaSummary(action.query)

          const completionTime = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })

          const assistantMessage = {
            sender: 'assistant',
            text: responseText,
            time: completionTime,
          }

          setMessages((prev) => [...prev, assistantMessage])
          lastReplyRef.current = responseText
          speak(responseText)
        } catch {
          const errorMsg = 'Sorry, I encountered an issue retrieving that information.'
          const assistantMessage = {
            sender: 'assistant',
            text: errorMsg,
            time: timeStr,
          }
          setMessages((prev) => [...prev, assistantMessage])
          lastReplyRef.current = errorMsg
          speak(errorMsg)
        } finally {
          setThinking(false)
        }
        return
      }

      // 6. Action: unknown -> Fallback to FastAPI Backend AI endpoint
      if (action?.type === 'unknown') {
        setMessages((prev) => [...prev, userMessage])
        setThinking(true)

        try {
          const data = await sendChatMessage(trimmed)
          const completionTime = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })

          const assistantMessage = {
            sender: 'assistant',
            text: data.reply,
            time: completionTime,
          }

          setMessages((prev) => [...prev, assistantMessage])
          lastReplyRef.current = data.reply
          speak(data.reply)

          if (data.ai_configured === false) {
            setAiOffline(true)
          } else {
            setAiOffline(false)
          }
        } catch {
          const offlineMsg =
            "I can't reach my AI brain right now — check that the backend is running."
          const completionTime = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })

          const assistantMessage = {
            sender: 'assistant',
            text: offlineMsg,
            time: completionTime,
          }

          setMessages((prev) => [...prev, assistantMessage])
          lastReplyRef.current = offlineMsg
          speak(offlineMsg)
          setAiOffline(true)
        } finally {
          setThinking(false)
        }
        return
      }

      // 7. Synchronous replies (greeting, time, date, joke, name, open-url, calculate/calculator)
      const replyText =
        reply !== null
          ? reply
          : `I don't know that one yet, but I'm ready to help with the time, date, a joke, or greetings.`

      const assistantMessage = {
        sender: 'assistant',
        text: replyText,
        time: timeStr,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])

      lastReplyRef.current = replyText
      speak(replyText)

      // Action: open-url
      if (action?.type === 'open-url' && action.url) {
        if (typeof window !== 'undefined' && window.open) {
          window.open(action.url, '_blank', 'noopener')
        }
      }
    },
    [cancel, speak]
  )

  // Voice recognition hook
  const {
    interimTranscript,
    listening,
    supported: recognitionSupported,
    start: startListening,
    stop: stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onFinalResult: (finalText) => {
      // Avoid processing speech recognition if assistant is actively speaking its own reply
      if (speakingRef.current) return
      const trimmed = (finalText || '').trim()
      if (!trimmed) return

      // Wake-word mode check
      if (wakeWordModeRef.current) {
        const { woke, command } = extractWakeCommand(trimmed, ASSISTANT_NAME)
        if (!woke) {
          // Non-wake utterances in wake mode are ignored
          resetTranscript()
          return
        }

        // Utterance contained wake word
        if (!command) {
          // User just said the wake word ('Captain') -> reply + speak acknowledgment
          const timeStr = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })
          const ackReply = "Yes? I'm listening."
          const userMessage = {
            sender: 'user',
            text: trimmed,
            time: timeStr,
          }
          const assistantMessage = {
            sender: 'assistant',
            text: ackReply,
            time: timeStr,
          }
          setMessages((prev) => [...prev, userMessage, assistantMessage])
          lastReplyRef.current = ackReply
          speak(ackReply)
          resetTranscript()
          return
        }

        // Extracted command is routed as usual
        handleCommand(command)
        resetTranscript()
      } else {
        // When OFF: every final transcript is treated as a command
        handleCommand(trimmed)
        resetTranscript()
      }
    },
  })

  // Determine central orb state: 'speaking' | 'thinking' | 'listening' | 'idle'
  const orbState = speaking
    ? 'speaking'
    : thinking
    ? 'thinking'
    : listening
    ? 'listening'
    : 'idle'

  const handleToggleListening = () => {
    if (speaking) {
      cancel()
    }
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleToggleWakeWord = () => {
    setWakeWordMode((prev) => {
      const next = !prev
      if (next && !listening && recognitionSupported) {
        startListening()
      }
      return next
    })
  }

  const handleStopSpeaking = () => {
    if (speaking) {
      cancel()
    }
    setThinking(false)
  }

  // Typed input always works as a direct command regardless of wake-word toggle
  const handleSendCommand = (text) => {
    if (speaking) {
      cancel()
    }
    handleCommand(text)
  }

  const handleClearTranscript = () => {
    setMessages([])
    resetTranscript()
  }

  const statusLabel = speaking
    ? 'Speaking'
    : thinking
    ? 'Thinking'
    : listening
    ? 'Listening'
    : 'Idle'

  return (
    <div className="min-h-screen bg-[#090b0e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur px-4 sm:px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              {ASSISTANT_NAME}
              <span className="text-[10px] font-mono uppercase bg-zinc-800 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                Phase 4
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">Personal Voice Assistant</p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          {aiOffline && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono"
              title="AI brain offline or not configured"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>AI brain offline</span>
            </div>
          )}

          {/* Assistant Status Badge (Listening / Idle / Speaking / Thinking) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span
              className={`w-2 h-2 rounded-full ${
                speaking
                  ? 'bg-cyan-300 animate-bounce'
                  : thinking
                  ? 'bg-cyan-400 animate-ping'
                  : listening
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-zinc-500'
              }`}
            />
            <span className="text-[11px] font-medium">{statusLabel}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-4 min-h-0">
        {/* Unsupported browser alert if SpeechRecognition is missing */}
        <BrowserNotice supported={recognitionSupported} />

        {/* Content Area: Grid on larger screens, column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 min-h-0 items-stretch">
          {/* Left Column: Central Animated Orb & Voice Info */}
          <div className="lg:col-span-5 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-between shrink-0 shadow-lg">
            <div className="w-full text-center">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Voice Interface
              </span>
              <p className="text-xs text-zinc-400 mt-1">
                {listening
                  ? wakeWordMode
                    ? `Say "${ASSISTANT_NAME}" followed by a command...`
                    : 'Listening for voice commands...'
                  : speaking
                  ? 'Generating voice response...'
                  : thinking
                  ? 'Accessing neural network...'
                  : 'Click orb or mic to activate voice'}
              </p>
            </div>

            {/* Central Animated Orb */}
            <div className="my-auto py-2 sm:py-4">
              <Orb state={orbState} onClick={handleToggleListening} />
            </div>

            {/* Quick Hints & Mode indicator */}
            <div className="w-full text-center pt-2 border-t border-zinc-900">
              <p className="text-[11px] text-zinc-400 font-mono">
                Wake Word: <span className="text-cyan-400 font-semibold">{`"${ASSISTANT_NAME}"`}</span>
                {wakeWordMode && (
                  <span className="ml-2 text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">
                    Filter Active
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Column: Live Transcript & Inputs */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-[380px] lg:min-h-0">
            {/* Live Conversation Transcript */}
            <Transcript
              messages={messages}
              interimText={interimTranscript}
              thinking={thinking}
              onClear={handleClearTranscript}
            />

            {/* Controls (Mic button, stop-speaking button, wake-word toggle, text input fallback, chips) */}
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3 shrink-0 shadow-lg">
              <Controls
                listening={listening}
                onToggleListening={handleToggleListening}
                recognitionSupported={recognitionSupported}
                onSendCommand={handleSendCommand}
                wakeWordMode={wakeWordMode}
                onToggleWakeWord={handleToggleWakeWord}
                speaking={speaking}
                onStopSpeaking={handleStopSpeaking}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 px-4 py-2 text-center text-[11px] text-zinc-400 font-mono shrink-0">
        Try: weather in Hyderabad · open YouTube · tell me a joke
      </footer>
    </div>
  )
}
