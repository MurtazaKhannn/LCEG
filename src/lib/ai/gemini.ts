import type { AiExample, AiExamplesResponse, GeneratedExample, Question } from '../types'
import { parseMetadata } from '../metadata'
import { buildExamplesPrompt, buildExplainMorePrompt, buildFillGeneratedOutputsPrompt } from './prompt'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  })

  if (!response.ok) {
    let apiMessage = ''
    try {
      const errBody = await response.json()
      apiMessage = errBody?.error?.message ?? ''
    }
    catch {
      // ignore parse failures
    }

    if (response.status === 429) {
      throw new GeminiError('Rate limit reached. Wait a minute and try again, or check your Gemini quota in AI Studio.', 429)
    }
    if (response.status === 400) {
      throw new GeminiError(
        apiMessage || 'Invalid API key or request. Check your Gemini API key in extension settings.',
        400,
      )
    }
    if (response.status === 404) {
      throw new GeminiError(
        apiMessage || `Model "${model}" was not found. Open Settings and pick a current Gemini model.`,
        404,
      )
    }
    throw new GeminiError(apiMessage || `Gemini API error: ${response.status}`, response.status)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new GeminiError('Empty response from Gemini')
  }

  return text
}

function parseJsonResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T
  }
  catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    throw new GeminiError('Failed to parse AI response as JSON')
  }
}

export async function generateAiExamples(
  apiKey: string,
  model: string,
  question: Question,
): Promise<AiExample[]> {
  const signature = parseMetadata(question.metaData)
  const prompt = buildExamplesPrompt(question, signature)
  const text = await callGemini(apiKey, model, prompt)
  const parsed = parseJsonResponse<AiExamplesResponse>(text)

  if (!parsed.examples?.length) {
    throw new GeminiError('AI returned no examples')
  }

  return parsed.examples
}

export async function fillGeneratedOutputs(
  apiKey: string,
  model: string,
  question: Question,
  examples: GeneratedExample[],
): Promise<GeneratedExample[]> {
  const prompt = buildFillGeneratedOutputsPrompt(question, examples)
  const text = await callGemini(apiKey, model, prompt)
  const parsed = parseJsonResponse<{
    results: Array<{ index: number, output: string, note?: string }>
  }>(text)

  if (!parsed.results?.length) {
    throw new GeminiError('AI returned no outputs for practice inputs')
  }

  return examples.map((ex, i) => {
    const result = parsed.results.find(r => r.index === i) ?? parsed.results[i]
    if (!result?.output) {
      return ex
    }
    return {
      ...ex,
      output: String(result.output).trim(),
      note: result.note?.trim() || ex.note,
    }
  })
}

export async function explainMore(
  apiKey: string,
  model: string,
  question: Question,
  example: AiExample,
): Promise<string[]> {
  const prompt = buildExplainMorePrompt(question, example)
  const text = await callGemini(apiKey, model, prompt)
  const parsed = parseJsonResponse<{ walkthrough: string[] }>(text)
  return parsed.walkthrough ?? []
}

export async function testGeminiConnection(apiKey: string, model: string): Promise<boolean> {
  const text = await callGemini(apiKey, model, 'Reply with JSON: {"status":"ok"}')
  const parsed = parseJsonResponse<{ status: string }>(text)
  return parsed.status === 'ok'
}
