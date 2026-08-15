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
  return text.replace(/&[a-z]+;|&#\d+;|&#x[a-f0-9]+;/gi, (entity) => {
    const lower = entity.toLowerCase()
    if (ENTITY_MAP[lower])
      return ENTITY_MAP[lower]
    const decMatch = entity.match(/^&#(\d+);$/)
    if (decMatch)
      return String.fromCharCode(Number(decMatch[1]))
    const hexMatch = entity.match(/^&#x([a-f0-9]+);$/i)
    if (hexMatch)
      return String.fromCharCode(Number.parseInt(hexMatch[1], 16))
    return ' '
  })
}

/** Works in both extension pages (DOM) and the service worker (no DOMParser). */
export function stripHtml(html: string): string {
  if (!html)
    return ''

  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|pre|li|tr|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

export function parseExamplesFromHtml(html: string): ParsedExample[] {
  if (!html)
    return []

  // Normalize block endings to newlines before stripping tags
  const textWithBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|pre|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  const decoded = decodeEntities(textWithBreaks)

  const normalized = decoded
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')

  // Find all example headers like "Example 1:", "Example 2", etc.
  const exampleHeaderRegex = /(?:^|\n)\s*Example\s+(\d+)\s*:?/gi
  const matches = [...normalized.matchAll(exampleHeaderRegex)]

  if (matches.length > 0) {
    const examples: ParsedExample[] = []
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const exampleNum = match[1]
      const startIndex = match.index + match[0].length
      let endIndex = normalized.length

      if (i + 1 < matches.length) {
        endIndex = matches[i + 1].index
      }
      else {
        const boundaryMatch = normalized.slice(startIndex).search(/(?:^|\n)\s*(?:Constraints|Follow[- ]up|Note):/i)
        if (boundaryMatch !== -1) {
          endIndex = startIndex + boundaryMatch
        }
      }

      const block = normalized.slice(startIndex, endIndex).trim()

      const inputMatch = block.match(/Input\s*:?\s*([\s\S]+?)(?=\n\s*Output\s*:?|$)/i)
      const outputMatch = block.match(/Output\s*:?\s*([\s\S]+?)(?=\n\s*Explanation\s*:?|$)/i)
      const explanationMatch = block.match(/Explanation\s*:?\s*([\s\S]+)$/i)

      if (inputMatch || outputMatch) {
        examples.push({
          label: `Example ${exampleNum}`,
          input: inputMatch ? inputMatch[1].trim() : '',
          output: outputMatch ? outputMatch[1].trim() : '',
          explanation: explanationMatch ? explanationMatch[1].trim() : undefined,
        })
      }
    }

    if (examples.length > 0) {
      return examples
    }
  }

  // Fallback for unnumbered or loose examples
  const loosePattern = /(?:^|\n)\s*Input\s*:?\s*([\s\S]+?)\n\s*Output\s*:?\s*([\s\S]+?)(?=(?:\n\s*Explanation\s*:?|\n\s*Input\s*:?|\n\s*Constraints\s*:?|$))/gi
  const looseMatches: ParsedExample[] = []
  let looseMatch = loosePattern.exec(normalized)
  let count = 1
  while (looseMatch) {
    looseMatches.push({
      label: `Example ${count++}`,
      input: looseMatch[1].trim(),
      output: looseMatch[2].trim(),
    })
    looseMatch = loosePattern.exec(normalized)
  }

  return looseMatches
}

export function parseConstraintsFromHtml(html: string): string {
  if (!html)
    return ''
  const text = stripHtml(html)
  const match = text.match(/(?:^|\n)\s*Constraints\s*:?\s*([\s\S]+?)(?=\n\s*(?:Follow[- ]up|Note):|$)/i)
  return match ? match[1].trim() : ''
}

