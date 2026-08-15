import type { AiExample, Question } from './types'

export type Message =
  | { type: 'GET_PROBLEM'; titleSlug: string }
  | { type: 'PROBLEM_DATA'; question: Question; titleSlug: string }
  | { type: 'PROBLEM_ERROR'; error: string }
  | { type: 'GENERATE_AI_EXAMPLES'; titleSlug: string; question: Question }
  | { type: 'AI_EXAMPLES_DATA'; examples: AiExample[]; fromCache: boolean }
  | { type: 'AI_EXAMPLES_ERROR'; error: string }
  | { type: 'EXPLAIN_MORE'; titleSlug: string; question: Question; example: AiExample }
  | { type: 'EXPLAIN_MORE_DATA'; walkthrough: string[] }

export function sendMessage<T extends Message['type']>(
  message: Extract<Message, { type: T }>,
): Promise<Extract<Message, { type: Message['type'] }>> {
  return chrome.runtime.sendMessage(message)
}
