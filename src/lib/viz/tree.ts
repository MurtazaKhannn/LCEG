interface TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
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

function treeHeight(node: TreeNode | null): number {
  if (!node)
    return 0
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right))
}

function renderLevel(node: TreeNode | null, level: number, pos: number, width: number, lines: string[][]): void {
  if (!node)
    return

  if (!lines[level])
    lines[level] = []

  while (lines[level].length <= pos) {
    lines[level].push('   ')
  }
  lines[level][pos] = String(node.val).padStart(3, ' ')

  const gap = Math.max(1, Math.floor(width / 2))
  renderLevel(node.left, level + 1, pos - gap, width, lines)
  renderLevel(node.right, level + 1, pos + gap, width, lines)
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

    const height = treeHeight(root)
    const width = Math.pow(2, height) - 1
    const lines: string[][] = []

    renderLevel(root, 0, Math.floor(width / 2), width, lines)

    return lines
      .map(line => line.join(''))
      .join('\n')
      .trimEnd()
  }
  catch {
    return null
  }
}

export function extractTreeArraysFromInputs(inputs: Record<string, string>): Array<{ name: string, ascii: string }> {
  const results: Array<{ name: string, ascii: string }> = []

  for (const [name, value] of Object.entries(inputs)) {
    if (value.startsWith('[')) {
      const ascii = treeArrayToAscii(value)
      if (ascii && ascii !== '(empty tree)') {
        results.push({ name, ascii })
      }
    }
  }

  return results
}

export function extractTreeFromExampleInput(input: string): string | null {
  const match = input.match(/=\s*(\[[^\]]*\])/)
  if (!match)
    return null
  return treeArrayToAscii(match[1])
}
