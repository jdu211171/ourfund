import { prisma } from '../../lib/db'
export async function handleAddGoal(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  await prisma.goal.create({
    data: {
      id: payload.id,
      householdId,
      title: payload.title,
      targetUsd: payload.targetUsd,
      savedUsd: payload.savedUsd || 0,
      targetDate: payload.targetDate,
      icon: payload.icon,
      color: payload.color,
      contributors: payload.contributors || [],
      history: payload.history || []
    }
  })
}

export async function handleUpdateGoal(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  const goal = await prisma.goal.findUnique({ where: { id: payload.id } })
  if (!goal || goal.householdId !== householdId) throw new Error('Forbidden')
  const updates: Record<string, unknown> = {}
  if (typeof payload.title === 'string') updates.title = payload.title
  if (typeof payload.targetUsd === 'number') updates.targetUsd = payload.targetUsd
  if (typeof payload.targetDate === 'string') updates.targetDate = payload.targetDate
  if (typeof payload.icon === 'string') updates.icon = payload.icon
  if (typeof payload.color === 'string') updates.color = payload.color
  if (Array.isArray(payload.contributors)) updates.contributors = payload.contributors
  if (Object.keys(updates).length === 0) return
  await prisma.goal.update({
    where: { id: payload.id },
    data: updates
  })
}

export async function handleUpdateGoalSavings(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  // Authorization: verify this goal belongs to the user's household
  const goal = await prisma.goal.findUnique({ where: { id: payload.id } })
  if (!goal || goal.householdId !== householdId) throw new Error('Forbidden')
  await prisma.goal.update({
    where: { id: payload.id },
    data: {
      savedUsd: payload.savedUsd,
      history: payload.history
    }
  })
}

export async function handleDeleteGoal(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  if (!householdId) throw new Error('No household linked')
  const goal = await prisma.goal.findUnique({ where: { id: payload.id } })
  if (!goal || goal.householdId !== householdId) throw new Error('Forbidden')
  await prisma.goal.delete({ where: { id: payload.id } })
}
