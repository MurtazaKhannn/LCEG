import type { Question } from '../types'
import { parseConstraintsFromHtml, parseExamplesFromHtml, stripHtml } from '../parse-content'
import type { ProblemSignature } from '../types'

export function buildExamplesPrompt(question: Question, signature: ProblemSignature | null): string {
  const description = stripHtml(question.content)
  const constraints = parseConstraintsFromHtml(question.content)
  const originalExamples = parseExamplesFromHtml(question.content)
  const originalExamplesText = originalExamples
    .map(ex => `${ex.label}\nInput: ${ex.input}\nOutput: ${ex.output}${ex.explanation ? `\nExplanation: ${ex.explanation}` : ''}`)
    .join('\n\n')

  const signatureText = signature
    ? `Function signature params: ${signature.params.map(p => `${p.name}: ${p.type}`).join(', ')}\nReturn type: ${signature.returnType}`
    : 'Function signature: unknown'

  return `You are helping a programmer understand a LeetCode problem by generating clearer examples.

Problem: ${question.title}
Difficulty: ${question.difficulty}
Description: ${description}
Constraints: ${constraints}
${signatureText}

Original LeetCode examples:
${originalExamplesText || 'None provided'}

Generate exactly 3 examples with labels "simple", "medium", and "edge":
- simple: smallest meaningful input that shows the core pattern
- medium: typical case with a few elements
- edge: boundary case (empty input, single element, duplicates, etc.)

For each example provide:
- input: formatted exactly as LeetCode would show it (e.g. "nums = [1,2], target = 3")
- output: the correct expected output
- walkthrough: array of 2-4 short steps explaining how the output is derived

Return ONLY valid JSON matching this schema:
{
  "examples": [
    {
      "label": "simple",
      "input": "...",
      "output": "...",
      "walkthrough": ["step 1", "step 2"]
    }
  ]
}`
}

export function buildExplainMorePrompt(question: Question, example: { input: string, output: string }): string {
  const description = stripHtml(question.content)

  return `Explain this LeetCode example in more detail for the problem "${question.title}".

Problem description: ${description}

Example:
Input: ${example.input}
Output: ${example.output}

Provide 4-6 detailed walkthrough steps that explain the logic step by step. Return ONLY valid JSON:
{
  "walkthrough": ["detailed step 1", "detailed step 2"]
}`
}
