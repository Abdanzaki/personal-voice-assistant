import React, { useState } from 'react'

/**
 * Control bar with:
 * 1. Mic button to toggle continuous listening (with textual state and aria-label).
 * 2. Stop-speaking button to interrupt active speech synthesis.
 * 3. Wake-word mode toggle with honest capability explanation.
 * 4. Text input box for typed fallback and keyboard accessibility.
 * 5. Quick-action suggestion pills.
 */
export function Controls({
  listening,
  onToggleListening,
  recognitionSupported,
  onSendCommand,
  disabled = false,
  wakeWordMode = false,
  onToggleWakeWord,
  speaking = false,
  onStopSpeaking,
}) {
  const [inputText, setInputText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return
    onSendCommand(trimmed)
    setInputText('')
  }

  const sampleCommands = [
    'What time is it?',
    'Weather in Hyderabad',
    'Calculate 12 times 8',
    'Who is Albert Einstein',
    'Open YouTube',
    'Google web development',
    'Tell me a joke',
  ]

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Controls Row: Voice actions & Wake-word toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={onToggleListening}
            disabled={!recognitionSupported || disabled}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
            title={
              !recognitionSupported
                ? 'Voice input unavailable in this browser'
                : listening
                ? 'Stop listening'
                : 'Start listening'
            }
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shrink-0 cursor-pointer disabled:cursor-not-allowed
              ${
                !recognitionSupported
                  ? 'bg-zinc-800/40 text-zinc-500 border border-zinc-800'
                  : listening
                  ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_16px_rgba(6,182,212,0.5)] font-semibold'
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-700/80 hover:border-cyan-400/80 hover:text-white'
              }
            `}
          >
            {/* Mic Icon */}
            <svg
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${listening ? 'animate-pulse' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {listening ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              )}
            </svg>
            <span>{listening ? 'Listening' : 'Listen'}</span>
          </button>

          {/* Stop Speaking Button */}
          <button
            type="button"
            onClick={onStopSpeaking}
            disabled={!speaking}
            aria-label="Stop speaking"
            title={speaking ? 'Interrupt speech synthesis' : 'Assistant is not speaking'}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shrink-0 cursor-pointer disabled:cursor-not-allowed
              ${
                speaking
                  ? 'bg-red-500/20 border border-red-500/60 text-red-300 hover:bg-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse'
                  : 'bg-zinc-900/40 text-zinc-600 border border-zinc-800/50 opacity-50'
              }
            `}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth={2} />
            </svg>
            <span>Stop speaking</span>
          </button>
        </div>

        {/* Wake-Word Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={wakeWordMode}
            aria-label="Wake-word mode"
            onClick={onToggleWakeWord}
            disabled={!recognitionSupported || disabled}
            className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed ${
              wakeWordMode ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                wakeWordMode ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-medium text-zinc-300 select-none">
            Wake-word mode
            {wakeWordMode && (
              <span className="ml-1 text-[10px] text-cyan-400 font-mono uppercase">
                (On)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Honest wake-word status hint */}
      <p className="text-[11px] text-zinc-400">
        Wake-word mode needs Chrome or Edge with mic access, and the tab open.
      </p>

      {/* Main input & send row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Text Input Fallback */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a command (e.g. 'weather in Tokyo', '12 * 8')..."
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || disabled}
          aria-label="Send command"
          className="px-3.5 py-2 bg-zinc-800 hover:bg-cyan-500 hover:text-zinc-950 text-zinc-300 font-medium text-sm rounded-lg border border-zinc-700/80 transition-colors disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-300 cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          Send
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
        <span className="text-zinc-500 font-mono text-[11px] shrink-0">Try:</span>
        {sampleCommands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => onSendCommand(cmd)}
            disabled={disabled}
            aria-label={`Try command ${cmd}`}
            className="shrink-0 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/40 text-[11px] transition-colors cursor-pointer disabled:opacity-50"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  )
}
