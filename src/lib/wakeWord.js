import { ASSISTANT_NAME } from '../config.js'

/**
 * Pure helper function to detect the wake word anywhere in an utterance
 * (case-insensitive, punctuation-tolerant) and extract the command.
 *
 * @param {string} transcript - The recognized speech utterance.
 * @param {string} [wakeWord=ASSISTANT_NAME] - The assistant wake word to detect.
 * @returns {{ woke: boolean, command: string }}
 */
export function extractWakeCommand(transcript, wakeWord = ASSISTANT_NAME) {
  if (!transcript || typeof transcript !== 'string' || !wakeWord) {
    return { woke: false, command: '' }
  }

  const escaped = wakeWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Check if wakeWord appears as a distinct word anywhere in transcript
  const wakeCheck = new RegExp('(^|[^a-zA-Z0-9])' + escaped + '([^a-zA-Z0-9]|$)', 'i')
  if (!wakeCheck.test(transcript)) {
    return { woke: false, command: '' }
  }

  // Remove the wake word and any immediately adjacent punctuation/whitespace
  const removeRegex = new RegExp('(?:^|[\\s,:;!?.\\-_/])+' + escaped + '(?:[\\s,:;!?.\\-_/]|$)+', 'i')
  let replaced = transcript.replace(removeRegex, ' ')

  // Fallback direct word replacement if not modified by previous regex
  if (replaced === transcript) {
    replaced = transcript.replace(new RegExp('\\b' + escaped + '\\b', 'i'), ' ')
  }

  // Clean leading and trailing punctuation & normalize multiple spaces
  const command = replaced
    .replace(/^[\s,.:;!?.\\-_/]+/, '')
    .replace(/[\s,.:;!?.\\-_/]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()

  return { woke: true, command }
}
