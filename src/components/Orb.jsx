import React from 'react'

/**
 * Central animated orb with four distinct visual states:
 * - idle: slow subtle pulse
 * - listening: active pulsing concentric rings
 * - speaking: dynamic waveform-like animation
 * - thinking: pulsing neural core with bouncing query indicators
 */
export function Orb({ state = 'idle', onClick }) {
  const isListening = state === 'listening'
  const isSpeaking = state === 'speaking'
  const isThinking = state === 'thinking'

  return (
    <div className="flex flex-col items-center justify-center select-none py-4">
      {/* Container for Orb & Rings */}
      <div
        onClick={onClick}
        className="relative flex items-center justify-center cursor-pointer group"
        title={isListening ? 'Click to stop listening' : 'Click to start listening'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        {/* Radiating Rings for Listening State */}
        {isListening && (
          <>
            <div className="absolute w-44 h-44 rounded-full border border-cyan-400/40 animate-ring-1 pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full border border-cyan-400/30 animate-ring-2 pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full border border-cyan-400/20 animate-ring-3 pointer-events-none" />
          </>
        )}

        {/* Ambient Glow for Speaking or Thinking State */}
        {(isSpeaking || isThinking) && (
          <div
            className={`absolute w-48 h-48 rounded-full pointer-events-none transition-all duration-500 ${
              isThinking ? 'bg-cyan-500/25 blur-2xl animate-pulse' : 'bg-cyan-500/15 blur-xl'
            }`}
          />
        )}

        {/* The Core Orb Sphere */}
        <div
          className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-zinc-950 flex items-center justify-center transition-all duration-300
            ${
              isListening
                ? 'border-2 border-cyan-400 animate-orb-listening'
                : isSpeaking
                ? 'border-2 border-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.45)]'
                : isThinking
                ? 'border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.5)] animate-pulse'
                : 'border border-cyan-500/30 animate-orb-idle hover:border-cyan-400/60'
            }
          `}
        >
          {/* Subtle inner grid/depth rings */}
          <div className="absolute inset-3 rounded-full border border-zinc-800/80 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-zinc-800/40 pointer-events-none" />

          {/* Orb Center Content according to state */}
          {isSpeaking ? (
            /* Speaking State: Waveform audio bars */
            <div className="flex items-center justify-center gap-1.5 h-14 z-10">
              <span className="w-1.5 bg-cyan-400 rounded-full wave-bar" style={{ height: '32px', animationDelay: '0.1s' }} />
              <span className="w-1.5 bg-cyan-300 rounded-full wave-bar" style={{ height: '44px', animationDelay: '0.35s' }} />
              <span className="w-1.5 bg-cyan-400 rounded-full wave-bar" style={{ height: '24px', animationDelay: '0.0s' }} />
              <span className="w-1.5 bg-cyan-200 rounded-full wave-bar" style={{ height: '50px', animationDelay: '0.45s' }} />
              <span className="w-1.5 bg-cyan-400 rounded-full wave-bar" style={{ height: '38px', animationDelay: '0.2s' }} />
              <span className="w-1.5 bg-cyan-300 rounded-full wave-bar" style={{ height: '46px', animationDelay: '0.5s' }} />
              <span className="w-1.5 bg-cyan-400 rounded-full wave-bar" style={{ height: '26px', animationDelay: '0.15s' }} />
            </div>
          ) : isListening ? (
            /* Listening State: Active glowing core dot with pulse */
            <div className="relative flex items-center justify-center z-10">
              <div className="w-8 h-8 rounded-full bg-cyan-400/30 animate-ping absolute" />
              <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />
            </div>
          ) : isThinking ? (
            /* Thinking State: Neural sync pulse with dots */
            <div className="flex items-center justify-center gap-2 z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-200 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            /* Idle State: Calm, glowing resting orb */
            <div className="relative flex items-center justify-center z-10">
              <div className="w-5 h-5 rounded-full bg-cyan-500/40 blur-[2px]" />
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
            </div>
          )}
        </div>
      </div>

      {/* State Label Badge */}
      <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-mono tracking-wider">
        <span
          className={`w-2 h-2 rounded-full ${
            isListening
              ? 'bg-cyan-400 animate-pulse'
              : isSpeaking
              ? 'bg-cyan-300 animate-bounce'
              : isThinking
              ? 'bg-cyan-400 animate-ping'
              : 'bg-zinc-600'
          }`}
        />
        <span className="text-zinc-300 uppercase">
          {isListening
            ? 'Listening...'
            : isSpeaking
            ? 'Speaking...'
            : isThinking
            ? 'Thinking...'
            : 'Standby'}
        </span>
      </div>
    </div>
  )
}
