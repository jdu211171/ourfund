import { prisma } from '../../lib/db'
import { assertHouseholdOwnership, requireHouseholdId } from '../helpers/context'
import { addGoalSchema, updateGoalSchema, updateGoalSavingsSchema } from '../validation/mutations'

// Create a new saving goal (validates payload first)
export async function handleAddGoal(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const parsed = addGoalSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  await prisma.goal.create({
    data: {
      id: parsed.id,
      householdId: resolvedHouseholdId,
      title: parsed.title,
      targetUsd: parsed.targetUsd,
      savedUsd: parsed.savedUsd || 0,
      targetDate: parsed.targetDate,
      icon: parsed.icon,
      color: parsed.color,
      contributors: parsed.contributors || [],
      history: parsed.history || []
    }
  })
}

// Update properties of an existing goal (only fields present are updated)
export async function handleUpdateGoal(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const parsed = updateGoalSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const goal = await prisma.goal.findUnique({ where: { id: parsed.id } })
  if (!goal) throw new Error('Forbidden')
  assertHouseholdOwnership(goal.householdId, resolvedHouseholdId)
  const updates: Record<string, unknown> = {}
  if (typeof parsed.title === 'string') updates.title = parsed.title
  if (typeof parsed.targetUsd === 'number') updates.targetUsd = parsed.targetUsd
  if (typeof parsed.targetDate === 'string') updates.targetDate = parsed.targetDate
  if (typeof parsed.icon === 'string') updates.icon = parsed.icon
  if (typeof parsed.color === 'string') updates.color = parsed.color
  if (Array.isArray(parsed.contributors)) updates.contributors = parsed.contributors
  if (Object.keys(updates).length === 0) return
  await prisma.goal.update({
    where: { id: parsed.id },
    data: updates
  })
}

// Update goal saved amount and history (used when recording contributions)
export async function handleUpdateGoalSavings(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const parsed = updateGoalSavingsSchema.parse(payload)
  const resolvedHouseholdId = requireHouseholdId(householdId)
  // Authorization: verify this goal belongs to the user's household
  const goal = await prisma.goal.findUnique({ where: { id: parsed.id } })
  if (!goal) throw new Error('Forbidden')
  assertHouseholdOwnership(goal.householdId, resolvedHouseholdId)
  await prisma.goal.update({
    where: { id: parsed.id },
    data: {
      savedUsd: parsed.savedUsd,
      history: parsed.history
    }
  })
}

// Delete a goal after checking ownership
export async function handleDeleteGoal(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const parsed = ((): { id: string } => ({ id: (payload && payload.id) || '' }))()
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const goal = await prisma.goal.findUnique({ where: { id: parsed.id } })
  if (!goal) throw new Error('Forbidden')
  assertHouseholdOwnership(goal.householdId, resolvedHouseholdId)
  await prisma.goal.delete({ where: { id: parsed.id } })
}
