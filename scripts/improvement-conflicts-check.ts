import assert from 'node:assert/strict'
import { findSelectedConflict, getImprovementConflict, validateImprovementReferences } from '../lib/improvement-conflicts'
import { DEMO_SUGGESTED_IMPROVEMENTS } from '../lib/demo/fixtures/ai'
import type { SuggestedImprovement } from '../lib/recipe-types'

const mild: SuggestedImprovement = { id: 'mild', category: 'taste', title: 'Mild base', description: 'Serve chilli separately' }
const hot: SuggestedImprovement = {
  id: 'hot', category: 'taste', title: 'Spicy base', description: 'Cook chilli into the sauce',
  conflicts: [{ improvementId: 'mild', reason: 'The base cannot be both spicy and mild.' }],
}
const lemon: SuggestedImprovement = { id: 'lemon', category: 'taste', title: 'Add lemon', description: 'Finish with lemon juice' }

// Categories impose no selection limits; legacy analyses without metadata work.
assert.equal(findSelectedConflict([mild, lemon]), undefined)
assert.equal(findSelectedConflict([]), undefined)
assert.equal(getImprovementConflict(hot, hot), undefined)
// One-sided metadata works in either selection order and across categories.
assert.equal(getImprovementConflict(mild, hot), hot.conflicts![0].reason)
assert.equal(getImprovementConflict(hot, mild), hot.conflicts![0].reason)
assert.match(findSelectedConflict([lemon, mild, { ...hot, category: 'kid-friendly' }])!, /Mild base.*Spicy base/)
assert.match(findSelectedConflict([hot, mild])!, /both spicy and mild/)
validateImprovementReferences([mild, hot, lemon])
validateImprovementReferences(DEMO_SUGGESTED_IMPROVEMENTS)
assert.throws(() => validateImprovementReferences([mild, mild]), /Duplicate/)
assert.throws(() => validateImprovementReferences([hot]), /Invalid/)
assert.throws(() => validateImprovementReferences([{ ...hot, conflicts: [{ improvementId: 'hot', reason: 'Self' }] }]), /Invalid/)
assert.throws(() => validateImprovementReferences([mild, { ...hot, conflicts: [{ improvementId: 'mild', reason: ' ' }] }]), /Invalid/)
console.log('Improvement compatibility checks passed')
