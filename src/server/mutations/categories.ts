import { prisma } from '../../lib/db'
import { assertHouseholdOwnership, requireHouseholdId } from '../helpers/context'
export async function handleAddCategory(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  await prisma.budgetCategory.create({
    data: {
      id: payload.id,
      householdId: resolvedHouseholdId,
      label: payload.label,
      limitUsd: payload.limitUsd,
      color: payload.color,
      icon: payload.icon
    }
  })
}

export async function handleUpdateCategory(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } })
  if (!cat) throw new Error('Forbidden')
  assertHouseholdOwnership(cat.householdId, resolvedHouseholdId)
  await prisma.budgetCategory.update({
    where: { id: payload.id },
    data: {
      label: payload.label,
      limitUsd: payload.limitUsd,
      color: payload.color,
      icon: payload.icon
    }
  })
}

export async function handleUpdateCategoryLimit(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  // Authorization: verify this category belongs to the user's household
  const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } })
  if (!cat) throw new Error('Forbidden')
  assertHouseholdOwnership(cat.householdId, resolvedHouseholdId)
  await prisma.budgetCategory.update({
    where: { id: payload.id },
    data: { limitUsd: payload.limitUsd }
  })
}

export async function handleDeleteCategory(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } })
  if (!cat) throw new Error('Forbidden')
  assertHouseholdOwnership(cat.householdId, resolvedHouseholdId)
  await prisma.budgetCategory.delete({ where: { id: payload.id } })
}
