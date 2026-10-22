import React, { useEffect, useRef } from 'react'
import { ASSISTANT_NAME } from '../config.js'

/**
 * Renders the live conversation transcript with speaker labels (You / Jarvis)
 * and auto-scrolls to the newest message.
 */
export function Transcript({ messages = [], interimText = '', onClear }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, interimText])

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-zinc-950/70 rounded-xl border border-zinc-800/80 overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Live Transcript
          </h2>
          {messages.length > 0 && (
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
              {messages.length}
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800/60"
            title="Clear conversation history"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm font-sans scroll-smooth"
      >
        {messages.length === 0 && !interimText && (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <svg
              className="w-8 h-8 mb-2 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-xs text-zinc-400 font-medium">No conversation yet</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
              Start listening with the mic or type a command below. Try asking for the time, date, or a joke!
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user'

          return (
            <div
              key={index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-opacity duration-200`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span
                  className={`text-[11px] font-semibold tracking-wide ${
                    isUser ? 'text-zinc-400' : 'text-cyan-400'
                  }`}
                >
                  {isUser ? 'You' : ASSISTANT_NAME}
                </span>
                {msg.time && (
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {msg.time}
                  </span>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 leading-relaxed text-sm ${
                  isUser
                    ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/50'
                    : 'bg-zinc-900/90 text-zinc-200 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}

        {/* Interim / In-progress speech indicator */}
        {interimText && (
          <div className="flex flex-col items-end opacity-80 animate-pulse">
            <div className="text-[11px] font-semibold tracking-wide text-zinc-400 mb-1 px-1">
              You (speaking...)
            </div>
            <div className="max-w-[85%] rounded-lg px-3.5 py-2 bg-zinc-800/50 border border-dashed border-cyan-500/40 text-zinc-300 italic text-sm">
              {interimText}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
