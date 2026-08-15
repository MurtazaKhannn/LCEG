import type { AiExample, ParsedExample, Question } from '@/lib/types'
import { sendMessage } from '@/lib/messages'
import { setCurrentTitleSlug } from '@/lib/cache'
import { getTitleSlugFromUrl } from '@/lib/slug'
import { parseExamplesFromHtml } from '@/lib/parse-content'
import { extractTreeFromExampleInput } from '@/lib/viz/tree'
import './styles.css'

let currentQuestion: Question | null = null
let currentSlug: string | null = null
let aiGenerateCooldown = false

const loadingEl = document.getElementById('loading')!
const contentEl = document.getElementById('content')!
const errorEl = document.getElementById('error')!

document.getElementById('settings-link')!.addEventListener('click', (e) => {
  e.preventDefault()
  chrome.runtime.openOptionsPage()
})

function showError(message: string) {
  loadingEl.classList.add('hidden')
  contentEl.classList.add('hidden')
  errorEl.textContent = message
  errorEl.classList.remove('hidden')
}

function showToast(message: string) {
  const toast = document.createElement('div')
  toast.className = 'copy-toast'
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2000)
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
  showToast('Copied to clipboard')
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function renderOriginalExamples(examples: ParsedExample[]): string {
  if (!examples.length) {
    return '<p class="card-note">No examples parsed from description.</p>'
  }

  return examples.map(ex => `
    <div class="card">
      <div class="card-label">${escapeHtml(ex.label)}</div>
      <div class="card-io">Input: ${escapeHtml(ex.input)}</div>
      <div class="card-io">Output: ${escapeHtml(ex.output)}</div>
      ${ex.explanation ? `<div class="card-note">${escapeHtml(ex.explanation)}</div>` : ''}
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm copy-btn">Copy</button>
      </div>
    </div>
  `).join('')
}

function renderAiExamples(examples: AiExample[], fromCache: boolean): string {
  return examples.map((ex, index) => {
    const treeAscii = extractTreeFromExampleInput(ex.input)
    return `
      <div class="card" data-ai-index="${index}">
        <div class="card-label">${escapeHtml(ex.label)} <span class="ai-badge">AI${fromCache ? ' · cached' : ''}</span></div>
        <div class="card-io">Input: ${escapeHtml(ex.input)}</div>
        <div class="card-io">Output: ${escapeHtml(ex.output)}</div>
        ${treeAscii ? `<pre class="tree-viz">${escapeHtml(treeAscii)}</pre>` : ''}
        <ol class="walkthrough">
          ${ex.walkthrough.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm copy-btn">Copy</button>
          <button class="btn btn-secondary btn-sm explain-more-btn" data-index="${index}">Explain more</button>
        </div>
        <div class="explain-more-result hidden" id="explain-${index}"></div>
      </div>
    `
  }).join('')
}

function renderCompare(original: ParsedExample[], aiExamples: AiExample[]): string {
  const orig = original[0]
  const ai = aiExamples[0]
  if (!orig || !ai)
    return ''

  return `
    <div class="section">
      <div class="section-title">Compare</div>
      <div class="compare-grid">
        <div class="compare-col">
          <div class="card">
            <div class="card-label">LeetCode</div>
            <div class="card-io">Input: ${escapeHtml(orig.input)}</div>
            <div class="card-io">Output: ${escapeHtml(orig.output)}</div>
          </div>
        </div>
        <div class="compare-col">
          <div class="card">
            <div class="card-label">LCEG AI</div>
            <div class="card-io">Input: ${escapeHtml(ai.input)}</div>
            <div class="card-io">Output: ${escapeHtml(ai.output)}</div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderQuestion(
  question: Question,
  aiExamples: AiExample[] | null = null,
  aiFromCache = false,
) {
  currentQuestion = question

  const originalExamples = parseExamplesFromHtml(question.content)

  const difficultyClass = `badge-difficulty-${question.difficulty.toLowerCase()}`
  const tags = question.topicTags.map(t =>
    `<span class="badge badge-tag">${escapeHtml(t.name)}</span>`,
  ).join('')

  contentEl.innerHTML = `
    <div class="problem-header">
      <div class="problem-title">${escapeHtml(question.title)}</div>
      <div class="badges">
        <span class="badge ${difficultyClass}">${escapeHtml(question.difficulty)}</span>
        ${tags}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Original Examples</div>
      ${renderOriginalExamples(originalExamples)}
    </div>

    <div class="section" id="ai-section">
      <div class="section-title">AI Examples</div>
      <button class="btn btn-primary" id="generate-ai-btn">Generate AI Examples</button>
      <p class="card-note" style="margin-top:8px">Requires a free Gemini API key in Settings. Click the button to generate examples with inputs, outputs, and walkthroughs.</p>
      <div id="ai-examples-container" style="margin-top:12px">
        ${aiExamples ? renderAiExamples(aiExamples, aiFromCache) : ''}
      </div>
    </div>

    ${aiExamples ? renderCompare(originalExamples, aiExamples) : ''}
  `

  loadingEl.classList.add('hidden')
  errorEl.classList.add('hidden')
  contentEl.classList.remove('hidden')

  bindEvents(aiExamples ?? [])
}

function bindEvents(existingAi: AiExample[]) {
  contentEl.querySelectorAll('.card').forEach((card) => {
    const copyBtn = card.querySelector('.copy-btn')
    if (!copyBtn)
      return

    copyBtn.addEventListener('click', () => {
      const ioLines = card.querySelectorAll('.card-io')
      const text = Array.from(ioLines).map(el => el.textContent ?? '').join('\n')
      const note = card.querySelector('.card-note:not(.practice-label)')?.textContent
      const fullText = note && !text.includes('=') ? `${text}\n${note}` : text
      copyText(fullText || (card.textContent?.trim() ?? ''))
    })
  })

  document.getElementById('generate-ai-btn')?.addEventListener('click', handleGenerateAi)

  contentEl.querySelectorAll('.explain-more-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleExplainMore(Number((btn as HTMLElement).dataset.index), existingAi))
  })
}

async function handleGenerateAi() {
  if (!currentQuestion || !currentSlug || aiGenerateCooldown)
    return

  const btn = document.getElementById('generate-ai-btn') as HTMLButtonElement
  btn.disabled = true
  aiGenerateCooldown = true
  btn.innerHTML = '<span class="spinner"></span>Generating...'

  try {
    const response = await sendMessage({
      type: 'GENERATE_AI_EXAMPLES',
      titleSlug: currentSlug,
      question: currentQuestion,
    }) as { type: string, examples?: AiExample[], fromCache?: boolean, error?: string }

    if (response.type === 'AI_EXAMPLES_ERROR' || response.error) {
      showToast(response.error ?? 'Generation failed')
      return
    }

    if (response.examples) {
      renderQuestion(currentQuestion, response.examples, response.fromCache ?? false)
      showToast(response.fromCache ? 'Loaded from cache' : 'AI examples generated')
    }
  }
  catch (err) {
    showToast(err instanceof Error ? err.message : 'Generation failed')
  }
  finally {
    setTimeout(() => {
      aiGenerateCooldown = false
    }, 3000)
    btn.disabled = false
    btn.textContent = 'Generate AI Examples'
  }
}

async function handleExplainMore(index: number, examples: AiExample[]) {
  if (!currentQuestion || !currentSlug)
    return

  const example = examples[index]
  if (!example)
    return

  const resultEl = document.getElementById(`explain-${index}`)
  if (!resultEl)
    return

  resultEl.classList.remove('hidden')
  resultEl.innerHTML = '<span class="spinner"></span> Loading detailed explanation...'

  try {
    const response = await sendMessage({
      type: 'EXPLAIN_MORE',
      titleSlug: currentSlug,
      question: currentQuestion,
      example,
    }) as { type: string, walkthrough?: string[], error?: string }

    if (response.walkthrough) {
      resultEl.innerHTML = `
        <ol class="walkthrough">
          ${response.walkthrough.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ol>
      `
    }
    else {
      resultEl.textContent = response.error ?? 'Failed to get explanation'
    }
  }
  catch (err) {
    resultEl.textContent = err instanceof Error ? err.message : 'Failed'
  }
}

async function loadProblem(titleSlug: string) {
  currentSlug = titleSlug
  loadingEl.classList.remove('hidden')
  contentEl.classList.add('hidden')
  errorEl.classList.add('hidden')

  try {
    const response = await sendMessage({ type: 'GET_PROBLEM', titleSlug }) as {
      type: string
      question?: Question
      error?: string
    }

    if (response.type === 'PROBLEM_ERROR' || response.error) {
      showError(response.error ?? 'Failed to load problem')
      return
    }

    if (response.question) {
      renderQuestion(response.question)
    }
  }
  catch (err) {
    showError(err instanceof Error ? err.message : 'Failed to load problem')
  }
}

async function getActiveProblemSlug(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url)
    return null
  return getTitleSlugFromUrl(tab.url)
}

async function syncFromActiveTab(force = false) {
  const slug = await getActiveProblemSlug()
  if (!slug) {
    currentSlug = null
    currentQuestion = null
    showError('Open a LeetCode problem, then open this panel.')
    return
  }

  if (!force && slug === currentSlug && currentQuestion)
    return

  await setCurrentTitleSlug(slug)
  await loadProblem(slug)
}

chrome.tabs.onActivated.addListener(() => {
  syncFromActiveTab().catch(() => {})
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url && changeInfo.status !== 'complete')
    return

  const [active] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!active || active.id !== tabId)
    return

  syncFromActiveTab(Boolean(changeInfo.url)).catch(() => {})
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PROBLEM_DATA' && message.question) {
    currentSlug = message.titleSlug
    renderQuestion(message.question)
  }
})

syncFromActiveTab(true)
