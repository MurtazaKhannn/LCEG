import type { Message } from '@/lib/messages'
import { fetchQuestion } from '@/lib/graphql'
import {
  getCachedAiExamples,
  getSettings,
  setCachedAiExamples,
  setCurrentTitleSlug,
} from '@/lib/cache'
import { generateAiExamples, explainMore } from '@/lib/ai/gemini'
import { getTitleSlugFromUrl } from '@/lib/slug'
import type { Question } from '@/lib/types'

const problemCache = new Map<string, Question>()

async function getOrFetchProblem(titleSlug: string): Promise<Question> {
  const cached = problemCache.get(titleSlug)
  if (cached)
    return cached

  const question = await fetchQuestion(titleSlug)
  problemCache.set(titleSlug, question)
  return question
}

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})

async function updateBadgeForTab(tabId: number, url?: string) {
  const slug = url ? getTitleSlugFromUrl(url) : null
  if (slug) {
    await chrome.action.setBadgeText({ tabId, text: 'LC' })
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#FFA116' })
  }
  else {
    await chrome.action.setBadgeText({ tabId, text: '' })
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateBadgeForTab(tabId, tab.url).catch(() => {})
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    await updateBadgeForTab(tabId, tab.url)
  }
  catch {
    // Tab may have closed
  }
})

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err: Error) => {
    if (message.type === 'GET_PROBLEM') {
      sendResponse({ type: 'PROBLEM_ERROR', error: err.message })
    }
    else if (message.type === 'GENERATE_AI_EXAMPLES') {
      sendResponse({ type: 'AI_EXAMPLES_ERROR', error: err.message })
    }
    else if (message.type === 'EXPLAIN_MORE') {
      sendResponse({ type: 'AI_EXAMPLES_ERROR', error: err.message })
    }
    else {
      sendResponse({ error: err.message })
    }
  })
  return true
})

async function handleMessage(message: Message) {
  switch (message.type) {
    case 'GET_PROBLEM': {
      await setCurrentTitleSlug(message.titleSlug)
      const question = await getOrFetchProblem(message.titleSlug)
      return { type: 'PROBLEM_DATA', question, titleSlug: message.titleSlug }
    }

    case 'GENERATE_AI_EXAMPLES': {
      const cached = await getCachedAiExamples(message.titleSlug)
      if (cached) {
        broadcastAiExamples(cached, true)
        return { type: 'AI_EXAMPLES_DATA', examples: cached, fromCache: true }
      }

      const settings = await getSettings()
      if (!settings.geminiApiKey) {
        throw new Error('No Gemini API key configured. Open extension settings to add one.')
      }

      const examples = await generateAiExamples(
        settings.geminiApiKey,
        settings.geminiModel,
        message.question,
      )

      await setCachedAiExamples(message.titleSlug, examples)
      broadcastAiExamples(examples, false)
      return { type: 'AI_EXAMPLES_DATA', examples, fromCache: false }
    }

    case 'EXPLAIN_MORE': {
      const settings = await getSettings()
      if (!settings.geminiApiKey) {
        throw new Error('No Gemini API key configured.')
      }

      const walkthrough = await explainMore(
        settings.geminiApiKey,
        settings.geminiModel,
        message.question,
        message.example,
      )

      return { type: 'EXPLAIN_MORE_DATA', walkthrough }
    }

    default:
      return { error: 'Unknown message type' }
  }
}

function broadcastAiExamples(examples: import('@/lib/types').AiExample[], fromCache: boolean) {
  chrome.runtime.sendMessage({
    type: 'AI_EXAMPLES_DATA',
    examples,
    fromCache,
  }).catch(() => {})
}
