import { Choice } from '@magic3t/common-types'
import { unexpected } from '@/common'

export type Tree = {
  branches: {
    1?: Tree
    2?: Tree
    3?: Tree
    4?: Tree
    5?: Tree
    6?: Tree
    7?: Tree
    8?: Tree
    9?: Tree
  }
  value: number
}

const allChoices: Choice[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function evaluateSet(set: Choice[]): 1 | 0 {
  if (set.length < 3) return 0
  for (let i = 0; i < set.length - 2; i++) {
    for (let j = i + 1; j < set.length - 1; j++) {
      for (let k = j + 1; k < set.length; k++) {
        if (set[i] + set[j] + set[k] === 15) return 1
      }
    }
  }
  return 0
}

function evaluateWhite(match: Choice[]): 1 | 0 | -1 {
  let isWhite = true
  const white: Choice[] = []
  const black: Choice[] = []
  for (const choice of match) {
    if (isWhite) white.push(choice)
    else black.push(choice)
    isWhite = !isWhite
  }

  const whiteValue = evaluateSet(white)
  const blackValue = evaluateSet(black)

  if (whiteValue === 1 && blackValue === 0) return 1
  if (blackValue === 1 && whiteValue === 0) return -1
  if (whiteValue === blackValue && blackValue === 0) return 0
  unexpected()
}

export function createTree(depth: number, previous: Choice[] = []): Tree {
  const value = evaluateWhite(previous)

  if (depth === 0 || value) {
    return {
      branches: {},
      value,
    }
  }

  const result: Tree = {
    branches: {},
    value: 0,
  }

  for (const choice of allChoices) {
    if (previous.includes(choice)) continue

    result.branches[choice] = createTree(depth - 1, [...previous, choice])
  }

  const children = Object.keys(result.branches).map((child) =>
    Number.parseInt(child, 10)
  ) as unknown as number[]

  const childValues = children.map((child) => result.branches[child].value)

  if (previous.length % 2 && children.length) {
    result.value = Math.min(...childValues)
  } else if (children.length) {
    result.value = Math.max(...childValues)
  }

  return result
}
