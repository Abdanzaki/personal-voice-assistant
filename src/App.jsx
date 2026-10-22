import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ASSISTANT_NAME } from './config.js'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis.js'
import { routeCommand } from './lib/commandRouter.js'
import { Orb } from './components/Orb.jsx'
import { Transcript } from './components/Transcript.jsx'
import { Controls } from './components/Controls.jsx'
import { BrowserNotice } from './components/BrowserNotice.jsx'

export default function App() {
  const [messages, setMessages] = useState([])
  const { speak, cancel, speaking, supported: ttsSupported } = useSpeechSynthesis()

  const speakingRef = useRef(speaking)
  useEffect(() => {
    speakingRef.current = speaking
  }, [speaking])

  // Process command pipeline (used for both voice and typed commands)
  const handleCommand = useCallback(
    (input) => {
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

      // 3. Resolve reply text (fallback to polite response if null)
      const replyText =
        result.reply !== null
          ? result.reply
          : `I don't know that one yet, but I'm ready to help with the time, date, a joke, or greetings.`

      const assistantMessage = {
        sender: 'assistant',
        text: replyText,
        time: timeStr,
      }

      // 4. Update transcript state with both messages
      setMessages((prev) => [...prev, userMessage, assistantMessage])

      // 5. Speak reply via Speech Synthesis
      speak(replyText)
    },
    [speak]
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
      if (finalText && finalText.trim()) {
        handleCommand(finalText)
        resetTranscript()
      }
    },
  })

  // Determine central orb state: 'speaking' | 'listening' | 'idle'
  const orbState = speaking ? 'speaking' : listening ? 'listening' : 'idle'

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

  return (
    <div className="min-h-screen bg-[#090b0e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              {ASSISTANT_NAME}
              <span className="text-[10px] font-mono uppercase bg-zinc-800 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                Phase 1
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">Personal Voice Assistant</p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                recognitionSupported ? (listening ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500') : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px]">
              {recognitionSupported ? (listening ? 'Mic Active' : 'Mic Ready') : 'Mic Unsupported'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                ttsSupported ? (speaking ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500') : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px]">
              {ttsSupported ? (speaking ? 'Speaking' : 'TTS Ready') : 'TTS Unsupported'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4 min-h-0">
        {/* Unsupported browser alert if SpeechRecognition is missing */}
        <BrowserNotice supported={recognitionSupported} />

        {/* Content Area: Grid on larger screens, column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 items-stretch">
          {/* Left Column: Central Animated Orb & Voice Control */}
          <div className="lg:col-span-5 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-6 flex flex-col items-center justify-between shrink-0 shadow-lg">
            <div className="w-full text-center">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Neural Interface
              </span>
              <p className="text-xs text-zinc-400 mt-1">
                {listening
                  ? 'Listening for voice commands...'
                  : speaking
                  ? 'Generating voice response...'
                  : 'Click orb or mic to activate voice'}
              </p>
            </div>

            {/* Central Animated Orb */}
            <div className="my-auto py-4">
              <Orb state={orbState} onClick={handleToggleListening} />
            </div>

            {/* Quick Hints */}
            <div className="w-full text-center">
              <p className="text-[11px] text-zinc-400 font-mono">
                Wake Word: <span className="text-cyan-400 font-semibold">{`"${ASSISTANT_NAME}"`}</span>
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Try &quot;Hey Jarvis, what time is it?&quot; or &quot;Tell me a joke&quot;
              </p>
            </div>
          </div>

          {/* Right Column: Live Transcript & Inputs */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-[420px] lg:min-h-0">
            {/* Live Conversation Transcript */}
            <Transcript
              messages={messages}
              interimText={interimTranscript}
              onClear={handleClearTranscript}
            />

            {/* Controls (Mic button, text input fallback, command chips) */}
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3 shrink-0 shadow-lg">
              <Controls
                listening={listening}
                onToggleListening={handleToggleListening}
                recognitionSupported={recognitionSupported}
                onSendCommand={handleSendCommand}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 px-4 py-2.5 text-center text-[11px] text-zinc-400 font-mono shrink-0">
        Jarvis Web Assistant • Phase 1 Foundation • Client-Side Voice Engine
      </footer>
    </div>
  )
}
