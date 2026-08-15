import type { GeneratedExample, ParamDef } from '../types'

function formatValue(_type: string, value: unknown): string {
  if (value === null)
    return 'null'
  if (typeof value === 'string')
    return `"${value}"`
  if (Array.isArray(value))
    return JSON.stringify(value)
  return String(value)
}

function generateForType(type: string, variant: 'simple' | 'medium' | 'edge'): unknown {
  const baseType = type.replace(/\[\]$/, '').replace(/^list<|>$/gi, '')

  if (type === 'integer[]' || type === 'int[]' || type === 'number[]') {
    if (variant === 'simple')
      return [1, 2]
    if (variant === 'medium')
      return [1, 2, 3, 4]
    return [1]
  }

  if (type === 'string[]') {
    if (variant === 'simple')
      return ['a']
    if (variant === 'medium')
      return ['abc', 'de', 'f']
    return []
  }

  if (type === 'string') {
    if (variant === 'simple')
      return 'abc'
    if (variant === 'medium')
      return 'hello'
    return ''
  }

  if (type === 'integer' || type === 'int' || type === 'long' || type === 'number') {
    // Prefer valid positive sizes (many LC problems use 1..n bounds, not 0)
    if (variant === 'simple')
      return 1
    if (variant === 'medium')
      return 5
    return 3
  }

  if (type === 'boolean') {
    return variant === 'edge' ? false : true
  }

  if (type.includes('ListNode')) {
    if (variant === 'simple')
      return [1, 2]
    if (variant === 'medium')
      return [1, 2, 3, 4]
    return [1]
  }

  if (type.includes('TreeNode')) {
    if (variant === 'simple')
      return [1]
    if (variant === 'medium')
      return [1, 2, 3]
    return []
  }

  if (type === 'character[][]' || type.includes('[][]')) {
    if (variant === 'simple')
      return [['X']]
    if (variant === 'medium')
      return [['X', 'O'], ['O', 'X']]
    return [['X', 'X'], ['X', 'X']]
  }

  if (type.endsWith('[]')) {
    if (variant === 'simple')
      return [1]
    if (variant === 'medium')
      return [1, 2, 3]
    return []
  }

  if (baseType === 'string')
    return variant === 'edge' ? '' : 'a'

  if (baseType === 'integer' || baseType === 'int')
    return variant === 'edge' ? 3 : 1

  return variant === 'edge' ? null : 1
}

function describeInputs(inputs: Record<string, string>): string {
  return Object.entries(inputs).map(([name, value]) => `${name} = ${value}`).join(', ')
}

function buildNote(
  params: ParamDef[],
  variant: 'simple' | 'medium' | 'edge',
  inputs: Record<string, string>,
): string {
  const shown = describeInputs(inputs)
  const types = params.map(p => `${p.name} (${p.type})`).join(', ')

  if (variant === 'simple') {
    return `Smallest useful case (${shown}). Start here to lock in the base case and core recurrence/loop before scaling up. Params: ${types}.`
  }
  if (variant === 'medium') {
    return `Typical mid-size case (${shown}). Good for checking that your logic still works when there are a few more choices/elements to process. Params: ${types}.`
  }
  return `Boundary / awkward case (${shown}). Use this to catch off-by-one errors, empty-ish inputs, or the smallest non-trivial multi-step scenario. Params: ${types}.`
}

const PRACTICE_OUTPUT
  = 'Not auto-computed — paste this input into LeetCode’s Testcase panel and Run to verify your answer.'

function buildExample(
  params: ParamDef[],
  variant: 'simple' | 'medium' | 'edge',
): GeneratedExample {
  const inputs: Record<string, string> = {}

  for (const param of params) {
    const value = generateForType(param.type, variant)
    inputs[param.name] = formatValue(param.type, value)
  }

  return {
    label: variant,
    inputs,
    output: PRACTICE_OUTPUT,
    note: buildNote(params, variant, inputs),
  }
}

export function generateArrayExamples(params: ParamDef[]): GeneratedExample[] {
  return (['simple', 'medium', 'edge'] as const).map(v => buildExample(params, v))
}

export function generateStringExamples(params: ParamDef[]): GeneratedExample[] {
  return (['simple', 'medium', 'edge'] as const).map(v => buildExample(params, v))
}

export function generateTreeExamples(params: ParamDef[]): GeneratedExample[] {
  const variants: Array<{ label: 'simple' | 'medium' | 'edge', treeValue: string }> = [
    { label: 'simple', treeValue: '[1]' },
    { label: 'medium', treeValue: '[1,2,3]' },
    { label: 'edge', treeValue: '[]' },
  ]

  return variants.map(({ label, treeValue }) => {
    const inputs: Record<string, string> = {}
    for (const param of params) {
      if (param.type.includes('TreeNode')) {
        inputs[param.name] = treeValue
      }
      else {
        inputs[param.name] = formatValue(param.type, generateForType(param.type, label))
      }
    }
    return {
      label,
      inputs,
      output: PRACTICE_OUTPUT,
      note: buildNote(params, label, inputs),
    }
  })
}

export function generateLinkedListExamples(params: ParamDef[]): GeneratedExample[] {
  const variants: Array<{ label: 'simple' | 'medium' | 'edge', listValue: string }> = [
    { label: 'simple', listValue: '[1,2]' },
    { label: 'medium', listValue: '[1,2,3,4]' },
    { label: 'edge', listValue: '[1]' },
  ]

  return variants.map(({ label, listValue }) => {
    const inputs: Record<string, string> = {}
    for (const param of params) {
      if (param.type.includes('ListNode')) {
        inputs[param.name] = listValue
      }
      else {
        inputs[param.name] = formatValue(param.type, generateForType(param.type, label))
      }
    }
    return {
      label,
      inputs,
      output: PRACTICE_OUTPUT,
      note: buildNote(params, label, inputs),
    }
  })
}
