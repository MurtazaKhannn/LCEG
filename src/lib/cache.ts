import type { AiExample, CachedAiExamples, Settings } from './types'

const AI_CACHE_PREFIX = 'ai_examples:'
const AI_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function aiCacheKey(titleSlug: string): string {
  return `${AI_CACHE_PREFIX}${titleSlug}`
}

export async function getCachedAiExamples(titleSlug: string): Promise<AiExample[] | null> {
  const key = aiCacheKey(titleSlug)
  const result = await chrome.storage.local.get(key)
  const cached = result[key] as CachedAiExamples | undefined

  if (!cached)
    return null

  if (Date.now() - cached.cachedAt > AI_CACHE_TTL_MS) {
    await chrome.storage.local.remove(key)
    return null
  }

  return cached.examples
}

export async function setCachedAiExamples(titleSlug: string, examples: AiExample[]): Promise<void> {
  const payload: CachedAiExamples = {
    examples,
    cachedAt: Date.now(),
  }
  await chrome.storage.local.set({ [aiCacheKey(titleSlug)]: payload })
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const RETIRED_GEMINI_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-001',
])

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']) as {
    geminiApiKey?: string
    geminiModel?: string
  }
  const storedModel = result.geminiModel ?? DEFAULT_GEMINI_MODEL
  const geminiModel = RETIRED_GEMINI_MODELS.has(storedModel)
    ? DEFAULT_GEMINI_MODEL
    : storedModel
  return {
    geminiApiKey: result.geminiApiKey ?? '',
    geminiModel,
  }
}

export async function setSettings(settings: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(settings)
}

export async function getCurrentTitleSlug(): Promise<string | null> {
  const result = await chrome.storage.session.get('currentTitleSlug') as {
    currentTitleSlug?: string
  }
  return result.currentTitleSlug ?? null
}

export async function setCurrentTitleSlug(titleSlug: string): Promise<void> {
  await chrome.storage.session.set({ currentTitleSlug: titleSlug })
}
