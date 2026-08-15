import type { Question } from '../types'

interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

export function isTreeQuestion(question?: Question | null): boolean {
  if (!question)
    return false

  // 1. Check topic tags (e.g. Tree, Binary Tree, Binary Search Tree)
  const hasTreeTag = question.topicTags?.some(tag =>
    ['tree', 'binary-tree', 'binary-search-tree'].includes(tag.slug?.toLowerCase() || tag.name?.toLowerCase()),
  )
  if (hasTreeTag)
    return true

  // 2. Check metadata parameters (e.g. TreeNode type or root param)
  try {
    const meta = typeof question.metaData === 'string' ? JSON.parse(question.metaData) : question.metaData
    const params = meta?.params ?? []
    if (params.some((p: { type?: string, name?: string }) =>
      p.type?.includes('TreeNode') || p.name === 'root',
    )) {
      return true
    }
  }
  catch {
    // ignore
  }

  return false
}

function arrayToTree(arr: unknown[]): TreeNode | null {
  if (!arr.length || arr[0] == null)
    return null

  const root: TreeNode = { val: arr[0] as number, left: null, right: null }
  const queue: TreeNode[] = [root]
  let i = 1

  while (queue.length && i < arr.length) {
    const node = queue.shift()!

    if (i < arr.length && arr[i] != null) {
      node.left = { val: arr[i] as number, left: null, right: null }
      queue.push(node.left)
    }
    i++

    if (i < arr.length && arr[i] != null) {
      node.right = { val: arr[i] as number, left: null, right: null }
      queue.push(node.right)
    }
    i++
  }

  return root
}

interface RenderedSubtree {
  lines: string[]
  width: number
  height: number
  rootCol: number
}

function renderSubtree(node: TreeNode | null): RenderedSubtree | null {
  if (!node)
    return null

  const valStr = String(node.val)

  // Leaf node
  if (!node.left && !node.right) {
    return {
      lines: [valStr],
      width: valStr.length,
      height: 1,
      rootCol: Math.floor(valStr.length / 2),
    }
  }

  // Only left child
  if (node.left && !node.right) {
    const left = renderSubtree(node.left)!
    const rootPos = left.rootCol + 2
    const topRow = `${' '.repeat(rootPos)}${valStr}`
    const branchRow = `${' '.repeat(left.rootCol + 1)}/`
    const width = Math.max(topRow.length, left.width, branchRow.length)
    const lines = [
      topRow.padEnd(width, ' '),
      branchRow.padEnd(width, ' '),
      ...left.lines.map(l => l.padEnd(width, ' ')),
    ]
    return {
      lines,
      width,
      height: lines.length,
      rootCol: rootPos + Math.floor(valStr.length / 2),
    }
  }

  // Only right child
  if (!node.left && node.right) {
    const right = renderSubtree(node.right)!
    const topRow = valStr
    const branchRow = `${' '.repeat(Math.max(1, Math.floor(valStr.length / 2) + 1))}\\`
    const rightShift = Math.max(2, valStr.length)
    const shiftedRight = right.lines.map(l => `${' '.repeat(rightShift)}${l}`)
    const width = Math.max(topRow.length, branchRow.length, ...shiftedRight.map(l => l.length))
    const lines = [
      topRow.padEnd(width, ' '),
      branchRow.padEnd(width, ' '),
      ...shiftedRight.map(l => l.padEnd(width, ' ')),
    ]
    return {
      lines,
      width,
      height: lines.length,
      rootCol: Math.floor(valStr.length / 2),
    }
  }

  // Both children
  const left = renderSubtree(node.left)!
  const right = renderSubtree(node.right)!

  const valLen = valStr.length
  const gap = 2
  const leftRoot = left.rootCol
  const rightRoot = left.width + gap + right.rootCol

  const midPoint = Math.floor((leftRoot + rightRoot) / 2)
  const rootStart = Math.max(0, midPoint - Math.floor(valLen / 2))
  const topRow = `${' '.repeat(rootStart)}${valStr}`

  // Connecting branch edges
  const slashPos = Math.max(0, Math.min(rootStart, leftRoot + Math.floor((midPoint - leftRoot) / 2)))
  const backslashPos = Math.max(rootStart + valLen, rightRoot - Math.floor((rightRoot - midPoint) / 2))

  const branchRow = `${' '.repeat(slashPos)}/${' '.repeat(Math.max(1, backslashPos - slashPos - 1))}\\`

  const maxSubHeight = Math.max(left.height, right.height)
  const combinedChildLines: string[] = []
  for (let r = 0; r < maxSubHeight; r++) {
    const leftLine = r < left.height ? left.lines[r] : ' '.repeat(left.width)
    const rightLine = r < right.height ? right.lines[r] : ' '.repeat(right.width)
    combinedChildLines.push(`${leftLine}${' '.repeat(gap)}${rightLine}`)
  }

  const lines = [topRow, branchRow, ...combinedChildLines]
  const width = Math.max(...lines.map(l => l.length))
  return {
    lines: lines.map(l => l.padEnd(width, ' ')),
    width,
    height: lines.length,
    rootCol: rootStart + Math.floor(valLen / 2),
  }
}

export function treeArrayToAscii(arrayNotation: string): string | null {
  try {
    const cleaned = arrayNotation.trim()
    if (cleaned === '[]' || cleaned === 'null')
      return '(empty tree)'

    const arr = JSON.parse(cleaned) as unknown[]
    if (!Array.isArray(arr))
      return null

    const root = arrayToTree(arr)
    if (!root)
      return '(empty tree)'

    const rendered = renderSubtree(root)
    if (!rendered)
      return '(empty tree)'

    return rendered.lines
      .map(line => line.trimEnd())
      .join('\n')
  }
  catch {
    return null
  }
}

export function extractTreeFromExampleInput(input: string): string | null {
  const match = input.match(/(?:root|tree|[a-z])\s*=\s*(\[[^\]]*\])/i) ?? input.match(/=\s*(\[[^\]]*\])/)
  if (!match)
    return null
  return treeArrayToAscii(match[1])
}

