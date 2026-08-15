import type { ProblemSignature } from './types'

export function parseMetadata(metaData: string): ProblemSignature | null {
  try {
    const parsed = JSON.parse(metaData)
    return {
      name: parsed.name ?? 'solution',
      params: (parsed.params ?? []).map((p: { name: string, type: string }) => ({
        name: p.name,
        type: p.type,
      })),
      returnType: parsed.return?.type ?? 'void',
    }
  }
  catch {
    return null
  }
}

export function hasTreeNode(signature: ProblemSignature): boolean {
  return signature.params.some(p => p.type.includes('TreeNode'))
    || signature.returnType.includes('TreeNode')
}

export function hasListNode(signature: ProblemSignature): boolean {
  return signature.params.some(p => p.type.includes('ListNode'))
    || signature.returnType.includes('ListNode')
}
