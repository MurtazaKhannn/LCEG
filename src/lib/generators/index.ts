import type { GeneratedExample, ProblemSignature } from '../types'
import { hasListNode, hasTreeNode } from '../metadata'
import {
  generateArrayExamples,
  generateLinkedListExamples,
  generateStringExamples,
  generateTreeExamples,
} from './array'

export { generateArrayExamples, generateStringExamples, generateTreeExamples, generateLinkedListExamples } from './array'

export function generateExamples(signature: ProblemSignature | null): GeneratedExample[] {
  if (!signature || signature.params.length === 0) {
    return [
      {
        label: 'simple',
        inputs: {},
        output: 'Not auto-computed — open Settings and use AI examples for full input/output walkthroughs.',
        note: 'No parameter metadata was available for this problem, so practice inputs could not be synthesized from the function signature.',
      },
    ]
  }

  if (hasTreeNode(signature))
    return generateTreeExamples(signature.params)

  if (hasListNode(signature))
    return generateLinkedListExamples(signature.params)

  const primaryType = signature.params[0]?.type ?? ''
  if (primaryType === 'string' || primaryType === 'character') {
    return generateStringExamples(signature.params)
  }

  return generateArrayExamples(signature.params)
}
