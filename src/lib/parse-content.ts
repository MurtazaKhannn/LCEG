import type { ParsedExample } from './types'

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
}

function decodeEntities(text: string): string {
  return text.replace(/&[a-z]+;|&#\d+;/gi, (entity) => {
    if (ENTITY_MAP[entity])
      return ENTITY_MAP[entity]
    const num = entity.match(/^&#(\d+);$/)
    if (num)
      return String.fromCharCode(Number(num[1]))
    return ' '
  })
}

/** Works in both extension pages (DOM) and the service worker (no DOMParser). */
export function stripHtml(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    }
    catch {
      // fall through to regex path
    }
  }

  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function parseExamplesFromPlainText(text: string): ParsedExample[] {
  const examples: ParsedExample[] = []
  const pattern
    = /Example\s+(\d+)\s*:?\s*Input:\s*([\s\S]+?)\s*Output:\s*([\s\S]+?)(?:\s*Explanation:\s*([\s\S]+?))?(?=Example\s+\d+|$)/gi

  let match = pattern.exec(text)
  while (match) {
    examples.push({
      label: `Example ${match[1]}`,
      input: match[2].trim(),
      output: match[3].trim(),
      explanation: match[4]?.trim(),
    })
    match = pattern.exec(text)
  }

  if (examples.length === 0) {
    const loose = /Input:\s*([\s\S]+?)\s*Output:\s*([\s\S]+?)(?=Input:|$)/gi
    let i = 1
    let looseMatch = loose.exec(text)
    while (looseMatch) {
      examples.push({
        label: `Example ${i++}`,
        input: looseMatch[1].trim(),
        output: looseMatch[2].trim(),
      })
      looseMatch = loose.exec(text)
    }
  }

  return examples
}

function parseExamplesWithDom(html: string): ParsedExample[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const examples: ParsedExample[] = []

  const strongs = doc.querySelectorAll('strong')
  strongs.forEach((strong) => {
    const text = strong.textContent?.trim() ?? ''
    if (!/^Example\s+\d+/i.test(text))
      return

    const container = strong.closest('p')?.parentElement ?? strong.parentElement
    if (!container)
      return

    const blockText = container.textContent ?? ''
    const inputMatch = blockText.match(/Input:\s*(.+?)(?=Output:|Explanation:|Example\s+\d|$)/s)
    const outputMatch = blockText.match(/Output:\s*(.+?)(?=Explanation:|Example\s+\d|$)/s)
    const explanationMatch = blockText.match(/Explanation:\s*(.+?)(?=Example\s+\d|$)/s)

    if (inputMatch || outputMatch) {
      examples.push({
        label: text.replace(':', ''),
        input: inputMatch?.[1]?.trim() ?? '',
        output: outputMatch?.[1]?.trim() ?? '',
        explanation: explanationMatch?.[1]?.trim(),
      })
    }
  })

  if (examples.length === 0) {
    const preBlocks = doc.querySelectorAll('pre')
    preBlocks.forEach((pre, index) => {
      const text = pre.textContent?.trim() ?? ''
      if (text.includes('Input:') || text.includes('Output:')) {
        const inputMatch = text.match(/Input:\s*(.+?)(?=Output:|Explanation:|$)/s)
        const outputMatch = text.match(/Output:\s*(.+?)(?=Explanation:|$)/s)
        examples.push({
          label: `Example ${index + 1}`,
          input: inputMatch?.[1]?.trim() ?? '',
          output: outputMatch?.[1]?.trim() ?? '',
        })
      }
    })
  }

  return examples
}

export function parseExamplesFromHtml(html: string): ParsedExample[] {
  if (typeof DOMParser !== 'undefined') {
    try {
      const fromDom = parseExamplesWithDom(html)
      if (fromDom.length > 0)
        return fromDom
    }
    catch {
      // fall through
    }
  }

  return parseExamplesFromPlainText(stripHtml(html))
}

export function parseConstraintsFromHtml(html: string): string {
  const text = stripHtml(html)
  const match = text.match(/Constraints:(.+?)(?=Follow-up:|$)/s)
  return match?.[1]?.trim() ?? ''
}
