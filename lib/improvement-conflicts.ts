import type { SuggestedImprovement } from './recipe-types'

/** Read both directions so older or one-sided conflict metadata is still enforced. */
export function getImprovementConflict(a: SuggestedImprovement, b: SuggestedImprovement): string | undefined {
  if (a.id === b.id) return undefined
  return a.conflicts?.find(c => c.improvementId === b.id)?.reason
    ?? b.conflicts?.find(c => c.improvementId === a.id)?.reason
}

export function validateImprovementReferences(improvements: SuggestedImprovement[]): void {
  const ids = new Set(improvements.map(i => i.id))
  if (ids.size !== improvements.length) throw new Error('Duplicate improvement IDs')
  for (const improvement of improvements) {
    for (const conflict of improvement.conflicts ?? []) {
      if (conflict.improvementId === improvement.id || !ids.has(conflict.improvementId) || !conflict.reason.trim()) {
        throw new Error('Invalid improvement conflict reference')
      }
    }
  }
}

export function findSelectedConflict(improvements: SuggestedImprovement[]): string | undefined {
  for (let i = 0; i < improvements.length; i++) {
    for (let j = i + 1; j < improvements.length; j++) {
      const reason = getImprovementConflict(improvements[i], improvements[j])
      if (reason) return `“${improvements[i].title}” and “${improvements[j].title}”: ${reason}`
    }
  }
}
