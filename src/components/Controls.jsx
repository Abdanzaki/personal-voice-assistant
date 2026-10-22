import React, { useState } from 'react'

/**
 * Control bar with:
 * 1. Mic button to toggle continuous listening.
 * 2. Text input box for typed fallback and keyboard accessibility.
 * 3. Quick-action suggestion pills.
 */
export function Controls({
  listening,
  onToggleListening,
  recognitionSupported,
  onSendCommand,
  disabled = false,
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
    "Today's date",
    'Tell me a joke',
    'Who are you?',
    'Hey Jarvis',
  ]

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-zinc-500 font-mono text-[11px] shrink-0">Try:</span>
        {sampleCommands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => onSendCommand(cmd)}
            disabled={disabled}
            className="shrink-0 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/40 text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Main input & mic row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shrink-0 cursor-pointer disabled:cursor-not-allowed
            ${
              !recognitionSupported
                ? 'bg-zinc-800/40 text-zinc-500 border border-zinc-800'
                : listening
                ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_20px_rgba(6,182,212,0.6)] font-semibold'
                : 'bg-zinc-900 text-zinc-200 border border-zinc-700/80 hover:border-cyan-400/80 hover:text-white'
            }
          `}
        >
          {/* Mic Icon */}
          <svg
            className={`w-4 h-4 ${listening ? 'animate-pulse' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {listening ? (
              // Stop square / active wave
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            ) : (
              // Microphone path
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            )}
          </svg>
          <span className="hidden sm:inline">
            {listening ? 'Listening...' : 'Listen'}
          </span>
        </button>

        {/* Text Input Fallback */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a command (e.g. 'what time is it')..."
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || disabled}
          aria-label="Send command"
          className="px-4 py-2.5 bg-zinc-800 hover:bg-cyan-500 hover:text-zinc-950 text-zinc-300 font-medium text-sm rounded-lg border border-zinc-700/80 transition-colors disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
