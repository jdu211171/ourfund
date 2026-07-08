import { prisma } from '../../lib/db'
import { requireHouseholdId } from '../helpers/context'
export async function handleAddWallet(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  await prisma.walletAccount.create({
    data: {
      id: payload.id,
      householdId: resolvedHouseholdId,
      label: payload.label,
      sub: payload.sub,
      type: payload.type,
      currency: payload.currency,
      members: payload.members,
      color: payload.color,
      startingBalanceUsd: payload.startingBalanceUsd || 0
    }
  })
}

export async function handleUpdateWallet(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const existingWallet = await prisma.walletAccount.findFirst({
    where: { id: payload.id, householdId: resolvedHouseholdId }
  })
  await prisma.walletAccount.update({
    where: { id: payload.id },
    data: {
      label: payload.label,
      sub: payload.sub,
      type: payload.type,
      currency: payload.currency,
      members: payload.members,
      color: payload.color,
      startingBalanceUsd: payload.startingBalanceUsd ?? undefined
    }
  })
  if (existingWallet && payload.label && existingWallet.label !== payload.label) {
    await prisma.transaction.updateMany({
      where: { householdId: resolvedHouseholdId, wallet: existingWallet.label },
      data: { wallet: payload.label }
    })
  }
}

export async function handleDeleteWallet(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined
) {
  const resolvedHouseholdId = requireHouseholdId(householdId)
  const existingWallet = await prisma.walletAccount.findFirst({
    where: { id: payload.id, householdId: resolvedHouseholdId }
  })
  await prisma.walletAccount.delete({
    where: { id: payload.id }
  })
  if (existingWallet) {
    await prisma.transaction.deleteMany({
      where: { householdId: resolvedHouseholdId, wallet: existingWallet.label }
    })
  }
}
