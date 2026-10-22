import React from 'react'

/**
 * Notice banner displayed when SpeechRecognition is unavailable in the user's browser.
 * Explains that Chrome or Edge is needed for voice recognition, without breaking page functionality.
 */
export function BrowserNotice({ supported }) {
  if (supported) return null

  return (
    <div className="w-full bg-amber-950/40 border border-amber-600/30 rounded-lg p-3 text-amber-200 text-xs flex items-start gap-2.5 shadow-lg">
      <svg
        className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="leading-relaxed">
        <span className="font-semibold text-amber-300">Speech Recognition Unavailable: </span>
        Voice input requires a browser with Web Speech API support (such as Google Chrome or Microsoft Edge).
        You can still interact with the assistant using the keyboard input box below.
      </div>
    </div>
  )
}
